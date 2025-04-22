import { customType } from "drizzle-orm/pg-core";

export enum complaintsReasonStatusEnum {
    "Несоблюдение авторских прав и прав на интеллектуальную собственность" = 0,
    "Нарушение конфиденциальности и персональных данных" = 1,
    "Клевета на известную личность" = 2,
    "Пропагандирует употребление наркотиков" = 3,
    "Оскорбления в адрес представителей определенной национальности" = 4,
    "Мошенническая схема" = 5
}

export const complaintsReasonEnum = customType<{ data: string | number; driverData: number }>({
    dataType() {
        return "int2";
    },
    toDriver(value: string | number): complaintsReasonStatusEnum {
        if (Object.values(complaintsReasonStatusEnum).includes(value)) {
            return value as complaintsReasonStatusEnum;
        }
        throw new Error(`Invalid status number: ${value}`);
    },
    fromDriver(value: number): string {
        if (value in complaintsReasonStatusEnum) {
            return complaintsReasonStatusEnum[value] as keyof typeof complaintsReasonStatusEnum;
        }
        throw new Error(`Invalid value from database: ${value}`);
    }
});
