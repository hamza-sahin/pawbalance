# PawBalance Recipe Ingredient UX Design Spec

**Date:** 2026-04-16  
**Scope:** Improve ingredient entry and editing UX on the recipe form  
**Status:** Approved design, ready for implementation planning

## Summary

The current recipe ingredient experience is too heavy for mobile. The ingredient composer is always visible, takes over the screen, competes with the page-level save action, and makes list review harder than it should be. The redesign shifts the screen to a list-first pattern with a focused add flow and lighter editing model.

The new experience uses a dedicated `Add ingredient` bottom sheet for creation, inserts new items at the top of the list, and lets users edit existing rows inline by expanding the tapped item. Manual entry remains fully allowed, while food-database suggestions are offered as optional assistive matches inside the add sheet.

Primary goals:
- Make adding several ingredients faster on mobile
- Reduce visual clutter and cognitive load on the recipe screen

Secondary goals:
- Keep manual ingredient submission unrestricted
- Preserve a clear review/edit flow for existing ingredients

## Problems in Current UX

- Ingredient form is always open and visually dominates the screen
- `Add Ingredient` and `Save Recipe` compete for attention on same page
- Ingredient list is visually secondary to composer
- Preparation chips create noise before the user has decided to add anything
- Editing model is not optimized for rapid review and correction
- Layout feels long and heavy on smaller iPhone screens

## Recommended Approach

Use a **list-first + add-sheet + inline row edit** model.

Why this approach:
- Keeps main page clean and reviewable
- Makes ingredient creation a focused single-task action
- Supports manual entry without forcing database selection
- Keeps editing close to list context instead of pushing users through another full-screen flow
- Aligns with mobile interaction guidance: clear hierarchy, single primary action per context, 44x44 touch targets, and reduced on-page clutter

## Information Architecture

Recipe form screen structure:
1. Recipe name
2. Pet selector
3. Ingredients header with count
4. `Add ingredient` button
5. Ingredient list or empty state
6. `Save recipe` button

This intentionally removes the always-open ingredient composer from the page.

## Ingredient Creation Flow

### Entry Point

The main recipe page shows a single `Add ingredient` button below the ingredients header.

### Add Ingredient Bottom Sheet

The bottom sheet contains:
- Sheet title: `Add ingredient`
- Labeled ingredient name input, autofocus enabled
- Optional suggestion list below the name input
- Preparation chips below suggestions
- Sticky primary CTA: `Add ingredient`

### Required Fields

Two values are required before creation:
- Ingredient name
- Preparation

The add button remains disabled until both are set.

### Suggestions Behavior

Food-database suggestions appear inside the bottom sheet under the ingredient name field.

Rules:
- Suggestions are assistive only
- Manual ingredient text is always allowed
- The user can ignore suggestions and still add their own text
- If the user taps a suggestion, the ingredient name is filled from that suggestion
- Preparation remains a separate required choice and is never inferred automatically

### Submission Behavior

When the user taps `Add ingredient`:
- Validate required fields
- Create ingredient immediately
- Close the bottom sheet immediately after success
- Insert the new ingredient at the **top** of the ingredient list

Rationale:
- Keeps the newest item near the user’s attention
- Supports faster repeated entry because the user can visually confirm the latest add without scanning to the bottom

## Ingredient List Behavior

### Empty State

When the recipe has no ingredients, show a calm empty state instead of a large open form.

Empty state includes:
- Simple icon
- Headline: `No ingredients yet`
- Short helper text
- `Add ingredient` button

### Collapsed Row

Default ingredient row shows:
- Ingredient name
- Preparation as secondary line
- Edit affordance on the right

The row should be compact, readable, and clearly tappable.

### Expanded Row

Tapping a row expands it inline.

Expanded row contains:
- Editable name input
- Preparation chips
- Row actions: `Save changes`, `Delete`, `Collapse`

Inline expansion rules:
- Only one ingredient row may be expanded at a time
- Expanding a different row collapses the previous row only if the previous row has no invalid unsaved state

### Unsaved Invalid Edit Handling

If the current expanded row contains invalid unsaved edits and the user taps another row, the current row remains open and the switch is blocked.

Reason:
- Fastest behavior without destructive surprise
- Prevents silent loss of edits
- Avoids additional confirmation dialogs in common editing flow

## Interaction Rules

- Manual ingredient submission is always allowed
- Duplicate ingredient names are allowed
- Missing suggestion match is not an error
- Creation and editing are separate contexts
- Page-level primary action is `Save recipe`
- Sheet-level primary action is `Add ingredient`
- Row-level primary action is `Save changes`

This separation prevents CTA competition and improves action clarity.

## Visual and UX Direction

The redesign should preserve the established PawBalance visual language while simplifying the hierarchy.

Direction:
- Keep current color palette
- Reduce border noise and nested visual boxes
- Increase whitespace between major sections
- Make the list the visual center of the ingredient area
- Keep rows lighter than the current ingredient form card
- Use clear labels rather than placeholder-only communication

UI/UX requirements from `ui-ux-pro-max`:
- Minimum `44x44px` touch targets on interactive controls
- Minimum `8px` spacing between adjacent tappable controls
- Visible labels for inputs
- Clear submit feedback and disabled state handling
- Mobile-first layout
- One dominant action per interaction context

## Animation and Feedback

After a successful add:
- Bottom sheet closes immediately
- New ingredient appears at the top of the list
- Use subtle insertion feedback if available
- Avoid jumpy page scroll behavior

After row edit save:
- Update row in place
- Collapse row or keep it expanded depending on current product pattern, but do not navigate away

Recommended implementation behavior:
- Keep row expanded after save only if there is a strong reason to support repeated edits
- Otherwise collapse after save for faster scanning

Preferred default for implementation: collapse after save.

## Accessibility Requirements

- All inputs have visible labels
- Buttons and icon actions expose accessible names
- Expanded/collapsed row state is communicated semantically
- Touch targets remain usable on iPhone-sized screens
- Suggestion rows are keyboard and screen-reader accessible
- Disabled add state is visually and semantically clear

## Out of Scope

This design does not include:
- Quantity fields
- Ingredient notes
- Bulk multi-select editing
- Advanced drag-and-drop reorder UX redesign
- Forced canonicalization against the food database
- Nutrition enrichment logic from matched suggestions

Those can be layered later without changing the core flow.

## Components Likely Affected

Expected implementation surface:
- Recipe form screen/component
- Ingredient list component
- New add-ingredient bottom sheet component, or refactor of existing ingredient entry UI into sheet form
- Ingredient row inline edit state
- Optional suggestion rendering inside add sheet

Exact file list should be finalized in the implementation plan.

## Success Criteria

The redesign succeeds if:
- Users can add ingredients faster than in the current always-open form flow
- The ingredient area no longer overwhelms the main recipe screen
- The newest ingredient appears immediately at the top of the list
- Users can review the ingredient list without scrolling past a persistent composer
- Users can edit an ingredient inline without leaving page context
- Manual entry remains fully possible even when no database suggestion exists

## Implementation Notes for Planning

The implementation plan should define:
- Whether the add sheet is a new component or a refactor of current ingredient form UI
- How suggestion matching is sourced and debounced
- How inline expanded row state is tracked
- Whether reorder ships now or remains unchanged
- Final behavior for row collapse after successful save

## Final Decision Record

Locked product decisions:
- Overall pattern: list-first
- Ingredient creation: bottom sheet
- Existing ingredient editing: inline row expansion
- Add success behavior: close sheet immediately
- New ingredient placement: top of list
- Food database integration: suggestions inside sheet
- Suggestion policy: optional, never blocking manual entry
- Preparation: required before add
- Invalid unsaved inline edit: block switching to another row until fixed or collapsed
- Primary goals: faster multi-add, cleaner less overwhelming screen
