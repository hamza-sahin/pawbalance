import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
QA_STATE = REPO_ROOT / ".codex" / "hooks" / "qa_state.py"


def run_cli(args, *, env, stdin_text=""):
    return subprocess.run(
        ["python3", str(QA_STATE), *args],
        cwd=REPO_ROOT,
        env=env,
        input=stdin_text,
        text=True,
        capture_output=True,
        check=True,
    )


class QaStateCliTest(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.state_file = Path(self.tempdir.name) / "qa-sessions.json"
        self.base_env = os.environ | {
            "QA_STATE_FILE": str(self.state_file),
            "CODEX_THREAD_ID": "thread-a",
        }

    def tearDown(self):
        self.tempdir.cleanup()

    def read_state(self):
        return json.loads(self.state_file.read_text())

    def test_feature_prompt_opens_gate_after_qualifying_edit(self):
        run_cli(["record-prompt", "--prompt", "implement profile feature"], env=self.base_env)
        run_cli(
            ["mark-edit", "--paths", "src/app/(app)/profile/page.tsx"],
            env=self.base_env,
        )

        session = self.read_state()["threads"]["thread-a"]
        self.assertEqual(session["mode"], "feature")
        self.assertTrue(session["qa_required"])
        self.assertFalse(session["qa_passed"])

    def test_docs_only_edit_does_not_open_gate(self):
        run_cli(["record-prompt", "--prompt", "implement workflow docs"], env=self.base_env)
        run_cli(
            ["mark-edit", "--paths", "docs/superpowers/specs/example.md"],
            env=self.base_env,
        )

        session = self.read_state()["threads"]["thread-a"]
        self.assertEqual(session["mode"], "feature")
        self.assertFalse(session["qa_required"])
        self.assertFalse(session["qa_passed"])

    def test_mark_passed_clears_gate(self):
        run_cli(["record-prompt", "--prompt", "fix auth bug"], env=self.base_env)
        run_cli(["mark-edit", "--paths", "src/hooks/use-auth.ts"], env=self.base_env)
        run_cli(["mark-qa", "--result", "passed"], env=self.base_env)

        session = self.read_state()["threads"]["thread-a"]
        self.assertFalse(session["qa_required"])
        self.assertTrue(session["qa_passed"])
        self.assertEqual(session["last_qa_result"], "passed")

    def test_same_workspace_edit_invalidates_other_thread(self):
        run_cli(["record-prompt", "--prompt", "implement recipes feature"], env=self.base_env)
        other_env = self.base_env | {"CODEX_THREAD_ID": "thread-b"}
        run_cli(["record-prompt", "--prompt", "fix profile bug"], env=other_env)
        run_cli(["mark-edit", "--paths", "src/components/recipe/recipe-form.tsx"], env=self.base_env)

        state = self.read_state()["threads"]
        self.assertTrue(state["thread-a"]["qa_required"])
        self.assertTrue(state["thread-b"]["qa_required"])


if __name__ == "__main__":
    unittest.main()
