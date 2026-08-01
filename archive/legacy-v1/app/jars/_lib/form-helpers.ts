/**
 * Helper functions for form data conversion and validation
 */

/**
 * Converts an object to FormData for server actions
 * Filters out undefined and null values
 */
export function objectToFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  return formData;
}

/**
 * Converts an object to FormData without filtering
 * Used when all values should be included
 */
export function objectToFormDataUnfiltered(data: Record<string, unknown>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, String(value));
  });
  return formData;
}
