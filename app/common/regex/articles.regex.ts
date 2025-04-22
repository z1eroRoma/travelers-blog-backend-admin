export const articleRegex = {
    titleRegex: new RegExp(/^[0-9a-zA-Zа-яА-ЯёЁ ~.,;:\n!@#$%^&*()_+-=`'"№?{}[\]<>]+$/),
    descriptionRegex: new RegExp(/^[0-9a-zA-Zа-яА-ЯёЁ ~.,;:\n!@#$%^&*()_+-=`'"№?{}[\]<>]+$/),
    locationRegex: new RegExp(/^[a-zA-Zа-яА-ЯёЁ -'`-]+$/),
    bigTextRegex: new RegExp(/^[0-9a-zA-Zа-яА-ЯёЁ ~.,;:\n!@#$%^&*()_+-=`'"№?{}[\]<>]+$/)
};
