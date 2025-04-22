import { customType } from "drizzle-orm/pg-core";

export enum VerifyCodeStatusEnum {
    EMAIL_VERIFICATION = 0,
    PASSWORD_RECOVERY = 1
}

export const verifyCodeEnum = customType<{ data: string | number; driverData: number }>({
    dataType() {
        return "int2";
    },
    toDriver(value: string | number): VerifyCodeStatusEnum {
        if (Object.values(VerifyCodeStatusEnum).includes(value)) {
            return value as VerifyCodeStatusEnum;
        }
        throw new Error(`Invalid status number: ${value}`);
    },
    fromDriver(value: number): string {
        if (value in VerifyCodeStatusEnum) {
            return VerifyCodeStatusEnum[value] as keyof typeof VerifyCodeStatusEnum;
        }

        throw new Error(`Invalid value from database: ${value}`);
    }
});
