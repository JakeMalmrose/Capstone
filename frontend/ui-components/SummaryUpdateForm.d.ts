import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Summary } from "./graphql/types";
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
export declare type SummaryUpdateFormInputValues = {
    summaryId?: string;
    text?: string;
    tags?: string[];
    createdAt?: string;
};
export declare type SummaryUpdateFormValidationValues = {
    summaryId?: ValidationFunction<string>;
    text?: ValidationFunction<string>;
    tags?: ValidationFunction<string>;
    createdAt?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type SummaryUpdateFormOverridesProps = {
    SummaryUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    summaryId?: PrimitiveOverrideProps<TextFieldProps>;
    text?: PrimitiveOverrideProps<TextFieldProps>;
    tags?: PrimitiveOverrideProps<TextFieldProps>;
    createdAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type SummaryUpdateFormProps = React.PropsWithChildren<{
    overrides?: SummaryUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    summary?: Summary;
    onSubmit?: (fields: SummaryUpdateFormInputValues) => SummaryUpdateFormInputValues;
    onSuccess?: (fields: SummaryUpdateFormInputValues) => void;
    onError?: (fields: SummaryUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: SummaryUpdateFormInputValues) => SummaryUpdateFormInputValues;
    onValidate?: SummaryUpdateFormValidationValues;
} & React.CSSProperties>;
export default function SummaryUpdateForm(props: SummaryUpdateFormProps): React.ReactElement;
