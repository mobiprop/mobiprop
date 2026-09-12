# Partner agency commission trial

The opportunity commission is the total available to share. Each AGENCY participant can receive a percentage of that same total or a fixed amount in the opportunity currency. Defaults are zero; existing opportunities retain their current figures.

Calculation: total minus partner fees = Mobi Prop gross commission. Agent percentages use that remainder. Net revenue subtracts the agent fee. Excessive combined partner fees and agent payouts exceeding the remainder are rejected when sharing is enabled.

Deploy the additive migration `20260912193000_agency_commission_split` before deploying the application. It adds three columns and does not rewrite existing commission inputs or creation dates.

## Reverting the trial

Revert the commission-related source changes from this release and redeploy, preserving any newer unrelated changes. The baseline before this release is GitHub main commit `1ac4f26a601b6a592621af8a2944e6c9ebc00d2f`. Leave the new database columns in place so entered partner fees remain recoverable. No destructive database rollback is required: old code ignores these columns.

Before reverting, export opportunities that have nonzero partner fees for reconciliation. Reverting restores the previous revenue calculation, so those opportunities will again report their total commission before partner deductions. Re-enabling should recompute aggregate fees from participants if opportunities were edited while the trial was disabled.
