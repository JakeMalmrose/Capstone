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
export declare type ArticleCreateFormInputValues = {
    articleId?: string;
    url?: string;
    title?: string;
    fullText?: string;
    tags?: string[];
    createdAt?: string;
};
export declare type ArticleCreateFormValidationValues = {
    articleId?: ValidationFunction<string>;
    url?: ValidationFunction<string>;
    title?: ValidationFunction<string>;
    fullText?: ValidationFunction<string>;
    tags?: ValidationFunction<string>;
    createdAt?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type ArticleCreateFormOverridesProps = {
    ArticleCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    articleId?: PrimitiveOverrideProps<TextFieldProps>;
    url?: PrimitiveOverrideProps<TextFieldProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    fullText?: PrimitiveOverrideProps<TextFieldProps>;
    tags?: PrimitiveOverrideProps<TextFieldProps>;
    createdAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type ArticleCreateFormProps = React.PropsWithChildren<{
    overrides?: ArticleCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: ArticleCreateFormInputValues) => ArticleCreateFormInputValues;
    onSuccess?: (fields: ArticleCreateFormInputValues) => void;
    onError?: (fields: ArticleCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: ArticleCreateFormInputValues) => ArticleCreateFormInputValues;
    onValidate?: ArticleCreateFormValidationValues;
} & React.CSSProperties>;
export default function ArticleCreateForm(props: ArticleCreateFormProps): React.ReactElement;
