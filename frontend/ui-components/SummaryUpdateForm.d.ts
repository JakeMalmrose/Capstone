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
    articleUrl?: string;
    title?: string;
    fullText?: string;
    summary?: string;
    tags?: string[];
    createdAt?: string;
    userId?: string;
};
export declare type SummaryUpdateFormValidationValues = {
    articleUrl?: ValidationFunction<string>;
    title?: ValidationFunction<string>;
    fullText?: ValidationFunction<string>;
    summary?: ValidationFunction<string>;
    tags?: ValidationFunction<string>;
    createdAt?: ValidationFunction<string>;
    userId?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type SummaryUpdateFormOverridesProps = {
    SummaryUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    articleUrl?: PrimitiveOverrideProps<TextFieldProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    fullText?: PrimitiveOverrideProps<TextFieldProps>;
    summary?: PrimitiveOverrideProps<TextFieldProps>;
    tags?: PrimitiveOverrideProps<TextFieldProps>;
    createdAt?: PrimitiveOverrideProps<TextFieldProps>;
    userId?: PrimitiveOverrideProps<TextFieldProps>;
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
