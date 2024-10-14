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
export declare type WebsiteCreateFormInputValues = {
    websiteId?: string;
    name?: string;
    url?: string;
    category?: string;
    tags?: string[];
};
export declare type WebsiteCreateFormValidationValues = {
    websiteId?: ValidationFunction<string>;
    name?: ValidationFunction<string>;
    url?: ValidationFunction<string>;
    category?: ValidationFunction<string>;
    tags?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type WebsiteCreateFormOverridesProps = {
    WebsiteCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    websiteId?: PrimitiveOverrideProps<TextFieldProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    url?: PrimitiveOverrideProps<TextFieldProps>;
    category?: PrimitiveOverrideProps<TextFieldProps>;
    tags?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type WebsiteCreateFormProps = React.PropsWithChildren<{
    overrides?: WebsiteCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: WebsiteCreateFormInputValues) => WebsiteCreateFormInputValues;
    onSuccess?: (fields: WebsiteCreateFormInputValues) => void;
    onError?: (fields: WebsiteCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: WebsiteCreateFormInputValues) => WebsiteCreateFormInputValues;
    onValidate?: WebsiteCreateFormValidationValues;
} & React.CSSProperties>;
export default function WebsiteCreateForm(props: WebsiteCreateFormProps): React.ReactElement;
