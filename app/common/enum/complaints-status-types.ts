import { customType } from "drizzle-orm/pg-core";

export enum ComplaintsStatusEnum {
    "Новая" = 0,
    "На рассмотрении" = 1,
    "Отклонена" = 2,
    "Подтверждена" = 3
}

export const complaintEnum = customType<{ data: string | number; driverData: number }>({
    dataType() {
        return "int2";
    },
    toDriver(value: string | number): ComplaintsStatusEnum {
        if (Object.values(ComplaintsStatusEnum).includes(value)) {
            return value as ComplaintsStatusEnum;
        }
        throw new Error(`Invalid status number: ${value}`);
    },
    fromDriver(value: number): string {
        if (value in ComplaintsStatusEnum) {
            return ComplaintsStatusEnum[value] as keyof typeof ComplaintsStatusEnum;
        }
        throw new Error(`Invalid value from database: ${value}`);
    }
});
