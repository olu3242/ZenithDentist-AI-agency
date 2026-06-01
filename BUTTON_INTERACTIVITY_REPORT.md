# Button Interactivity Report

## Operational Buttons

- Signup submit: server action, pending spinner, error redirect.
- Login submit: Supabase password auth, pending spinner, error redirect.
- Forgot password submit: Supabase reset request when configured, pending spinner.
- Onboarding complete: database updates, pending spinner, role redirect.
- ROI submit: client validation, server action, success/error message.
- Booking CTA: analytics event and external booking link.
- FAQ buttons: state update and analytics event.
- Simulator queue: visible queued state.

## Remaining Gaps

Advanced workflow/runtime command buttons need dedicated mutation APIs before they can be considered fully operational backend controls.
