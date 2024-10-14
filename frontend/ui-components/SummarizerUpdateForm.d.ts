import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Summarizer } from "./graphql/types";
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
export declare type SummarizerUpdateFormInputValues = {
    summarizerId?: string;
    name?: string;
    description?: string;
    tags?: string[];
    tier?: string;
};
export declare type SummarizerUpdateFormValidationValues = {
    summarizerId?: ValidationFunction<string>;
    name?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    tags?: ValidationFunction<string>;
    tier?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type SummarizerUpdateFormOverridesProps = {
    SummarizerUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    summarizerId?: PrimitiveOverrideProps<TextFieldProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    tags?: PrimitiveOverrideProps<TextFieldProps>;
    tier?: PrimitiveOverrideProps<SelectFieldProps>;
} & EscapeHatchProps;
export declare type SummarizerUpdateFormProps = React.PropsWithChildren<{
    overrides?: SummarizerUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    summarizer?: Summarizer;
    onSubmit?: (fields: SummarizerUpdateFormInputValues) => SummarizerUpdateFormInputValues;
    onSuccess?: (fields: SummarizerUpdateFormInputValues) => void;
    onError?: (fields: SummarizerUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: SummarizerUpdateFormInputValues) => SummarizerUpdateFormInputValues;
    onValidate?: SummarizerUpdateFormValidationValues;
} & React.CSSProperties>;
export default function SummarizerUpdateForm(props: SummarizerUpdateFormProps): React.ReactElement;
