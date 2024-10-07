import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type SummaryCreateFormInputValues = {
    articleUrl?: string;
    title?: string;
    fullText?: string;
    summary?: string;
    tags?: string[];
    createdAt?: string;
    userId?: string;
};
export declare type SummaryCreateFormValidationValues = {
    articleUrl?: ValidationFunction<string>;
    title?: ValidationFunction<string>;
    fullText?: ValidationFunction<string>;
    summary?: ValidationFunction<string>;
    tags?: ValidationFunction<string>;
    createdAt?: ValidationFunction<string>;
    userId?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type SummaryCreateFormOverridesProps = {
    SummaryCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    articleUrl?: PrimitiveOverrideProps<TextFieldProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    fullText?: PrimitiveOverrideProps<TextFieldProps>;
    summary?: PrimitiveOverrideProps<TextFieldProps>;
    tags?: PrimitiveOverrideProps<TextFieldProps>;
    createdAt?: PrimitiveOverrideProps<TextFieldProps>;
    userId?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type SummaryCreateFormProps = React.PropsWithChildren<{
    overrides?: SummaryCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: SummaryCreateFormInputValues) => SummaryCreateFormInputValues;
    onSuccess?: (fields: SummaryCreateFormInputValues) => void;
    onError?: (fields: SummaryCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: SummaryCreateFormInputValues) => SummaryCreateFormInputValues;
    onValidate?: SummaryCreateFormValidationValues;
} & React.CSSProperties>;
export default function SummaryCreateForm(props: SummaryCreateFormProps): React.ReactElement;
