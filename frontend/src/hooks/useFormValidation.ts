import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
  message?: string;
}

export interface FieldValidation {
  [field: string]: ValidationRule[];
}

export interface ValidationErrors {
  [field: string]: string;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: FieldValidation
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (field: string, value: any): string | undefined => {
      const rules = validationRules[field];
      if (!rules) return undefined;

      for (const rule of rules) {
        // Required validation
        if (rule.required && (!value || value === '')) {
          return rule.message || `${field} is required`;
        }

        // Skip other validations if value is empty and not required
        if (!value && !rule.required) continue;

        // Min/Max number validation
        if (typeof value === 'number') {
          if (rule.min !== undefined && value < rule.min) {
            return rule.message || `${field} must be at least ${rule.min}`;
          }
          if (rule.max !== undefined && value > rule.max) {
            return rule.message || `${field} must be at most ${rule.max}`;
          }
        }

        // MinLength/MaxLength string validation
        if (typeof value === 'string') {
          if (rule.minLength !== undefined && value.length < rule.minLength) {
            return rule.message || `${field} must be at least ${rule.minLength} characters`;
          }
          if (rule.maxLength !== undefined && value.length > rule.maxLength) {
            return rule.message || `${field} must be at most ${rule.maxLength} characters`;
          }
        }

        // Pattern validation
        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
          return rule.message || `${field} format is invalid`;
        }

        // Custom validation
        if (rule.custom) {
          const customError = rule.custom(value);
          if (customError) return customError;
        }
      }

      return undefined;
    },
    [validationRules]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((field) => {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationRules, values, validateField]);

  const handleChange = useCallback(
    (field: string, value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }));

      // Validate on change if field has been touched
      if (touched[field]) {
        const error = validateField(field, value);
        setErrors((prev) => ({
          ...prev,
          [field]: error || ''
        }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      const error = validateField(field, values[field]);
      setErrors((prev) => ({
        ...prev,
        [field]: error || ''
      }));
    },
    [values, validateField]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues,
    setErrors
  };
}
