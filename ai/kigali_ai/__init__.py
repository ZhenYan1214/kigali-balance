"""Kigali Balance AI modules.

Every module reads only what the system can observe (ledger events, invoices, equipment and
actor registers) and returns scores with human-readable reasons. Modules flag cases for human
review; they never sanction anyone. Ground truth from the simulator is used only by the
evaluation scripts, never by a module.
"""
