import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Feed } from "./graphql/types";
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
export declare type FeedUpdateFormInputValues = {
    name?: string;
    description?: string;
    url?: string;
    type?: string;
    websiteId?: string;
};
export declare type FeedUpdateFormValidationValues = {
    name?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    url?: ValidationFunction<string>;
    type?: ValidationFunction<string>;
    websiteId?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type FeedUpdateFormOverridesProps = {
    FeedUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    url?: PrimitiveOverrideProps<TextFieldProps>;
    type?: PrimitiveOverrideProps<SelectFieldProps>;
    websiteId?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type FeedUpdateFormProps = React.PropsWithChildren<{
    overrides?: FeedUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    feed?: Feed;
    onSubmit?: (fields: FeedUpdateFormInputValues) => FeedUpdateFormInputValues;
    onSuccess?: (fields: FeedUpdateFormInputValues) => void;
    onError?: (fields: FeedUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: FeedUpdateFormInputValues) => FeedUpdateFormInputValues;
    onValidate?: FeedUpdateFormValidationValues;
} & React.CSSProperties>;
export default function FeedUpdateForm(props: FeedUpdateFormProps): React.ReactElement;
