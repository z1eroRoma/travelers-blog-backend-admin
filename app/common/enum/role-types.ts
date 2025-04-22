import { customType } from "drizzle-orm/pg-core";

export enum RoleStatusEnum {
    "Админ" = 0,
    "Супер админ" = 1
}

export const roleEnum = customType<{ data: string | number; driverData: number }>({
    dataType() {
        return "int2";
    },
    toDriver(value: string | number): RoleStatusEnum {
        if (Object.values(RoleStatusEnum).includes(value)) {
            return value as RoleStatusEnum;
        }
        throw new Error(`Invalid status number: ${value}`);
    },
    fromDriver(value: number): string {
        if (value in RoleStatusEnum) {
            return RoleStatusEnum[value] as keyof typeof RoleStatusEnum;
        }
        throw new Error(`Invalid value from database: ${value}`);
    }
});
