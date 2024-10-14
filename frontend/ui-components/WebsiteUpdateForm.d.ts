import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Website } from "./graphql/types";
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
export declare type WebsiteUpdateFormInputValues = {
    websiteId?: string;
    name?: string;
    url?: string;
    category?: string;
    tags?: string[];
};
export declare type WebsiteUpdateFormValidationValues = {
    websiteId?: ValidationFunction<string>;
    name?: ValidationFunction<string>;
    url?: ValidationFunction<string>;
    category?: ValidationFunction<string>;
    tags?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type WebsiteUpdateFormOverridesProps = {
    WebsiteUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    websiteId?: PrimitiveOverrideProps<TextFieldProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    url?: PrimitiveOverrideProps<TextFieldProps>;
    category?: PrimitiveOverrideProps<TextFieldProps>;
    tags?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type WebsiteUpdateFormProps = React.PropsWithChildren<{
    overrides?: WebsiteUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    website?: Website;
    onSubmit?: (fields: WebsiteUpdateFormInputValues) => WebsiteUpdateFormInputValues;
    onSuccess?: (fields: WebsiteUpdateFormInputValues) => void;
    onError?: (fields: WebsiteUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: WebsiteUpdateFormInputValues) => WebsiteUpdateFormInputValues;
    onValidate?: WebsiteUpdateFormValidationValues;
} & React.CSSProperties>;
export default function WebsiteUpdateForm(props: WebsiteUpdateFormProps): React.ReactElement;
