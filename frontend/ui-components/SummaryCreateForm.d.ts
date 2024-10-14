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
    summaryId?: string;
    text?: string;
    tags?: string[];
    createdAt?: string;
};
export declare type SummaryCreateFormValidationValues = {
    summaryId?: ValidationFunction<string>;
    text?: ValidationFunction<string>;
    tags?: ValidationFunction<string>;
    createdAt?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type SummaryCreateFormOverridesProps = {
    SummaryCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    summaryId?: PrimitiveOverrideProps<TextFieldProps>;
    text?: PrimitiveOverrideProps<TextFieldProps>;
    tags?: PrimitiveOverrideProps<TextFieldProps>;
    createdAt?: PrimitiveOverrideProps<TextFieldProps>;
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
