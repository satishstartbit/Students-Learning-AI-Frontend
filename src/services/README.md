# src/services

Cross-module API services - things more than one module needs (e.g. a shared
lookup or reference-data call).

Module-specific API calls belong in `src/modules/<module>/services/` instead.

Every service in either location talks to the API through `utils/apiClient`.
Components and pages never call the API directly.
