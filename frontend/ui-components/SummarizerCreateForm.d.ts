import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type SummarizerCreateFormInputValues = {
    summarizerId?: string;
    name?: string;
    description?: string;
    tags?: string[];
    tier?: string;
};
export declare type SummarizerCreateFormValidationValues = {
    summarizerId?: ValidationFunction<string>;
    name?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    tags?: ValidationFunction<string>;
    tier?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type SummarizerCreateFormOverridesProps = {
    SummarizerCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    summarizerId?: PrimitiveOverrideProps<TextFieldProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    tags?: PrimitiveOverrideProps<TextFieldProps>;
    tier?: PrimitiveOverrideProps<SelectFieldProps>;
} & EscapeHatchProps;
export declare type SummarizerCreateFormProps = React.PropsWithChildren<{
    overrides?: SummarizerCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: SummarizerCreateFormInputValues) => SummarizerCreateFormInputValues;
    onSuccess?: (fields: SummarizerCreateFormInputValues) => void;
    onError?: (fields: SummarizerCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: SummarizerCreateFormInputValues) => SummarizerCreateFormInputValues;
    onValidate?: SummarizerCreateFormValidationValues;
} & React.CSSProperties>;
export default function SummarizerCreateForm(props: SummarizerCreateFormProps): React.ReactElement;
