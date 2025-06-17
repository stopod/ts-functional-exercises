import { ValidationResult, ValidationError } from './validation-system';
export declare function formatValidationErrors(errors: ValidationError[]): string;
export declare function groupErrorsByField(errors: ValidationError[]): Record<string, ValidationError[]>;
export declare function mapValidationResult<T, U>(result: ValidationResult<T>, mapper: (value: T) => U): ValidationResult<U>;
export declare function runValidationExamples(): void;
