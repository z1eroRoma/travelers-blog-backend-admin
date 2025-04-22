import { customType } from "drizzle-orm/pg-core";

export enum aricleStatusEnum {
    "Черновик" = 0,
    "На модерации" = 1,
    "Отклонено" = 2,
    "Опубликовано" = 3,
    "Снят с публикации" = 4
}

export const aricleEnum = customType<{ data: string | number; driverData: number }>({
    dataType() {
        return "int2";
    },
    toDriver(value: string | number): aricleStatusEnum {
        if (Object.values(aricleStatusEnum).includes(value)) {
            return value as aricleStatusEnum;
        }
        throw new Error(`Invalid status number: ${value}`);
    },
    fromDriver(value: number): string {
        if (value in aricleStatusEnum) {
            return aricleStatusEnum[value] as keyof typeof aricleStatusEnum;
        }
        throw new Error(`Invalid value from database: ${value}`);
    }
});
