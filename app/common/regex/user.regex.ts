export const userRegex = {
    birthDateRegex: new RegExp(/^(3[01]|[12][0-9]|0?[1-9])(\.)(1[0-2]|0?[1-9])\2([0-9]{2})?[0-9]{2}$/),
    CodeRegex: new RegExp(/^[0-9]+$/),
    descriptionRegex: new RegExp(/^[0-9a-zA-Zа-яА-ЯёЁ ~.,;:\n!@#$%^&*()_+-=`'"№?{}[\]<>]+$/),
    passwordRegex: new RegExp(/^[0-9a-zA-Z-_!?]+$/),
    realNameRegex: new RegExp(/^[a-zA-Zа-яА-ЯёЁ \-']+$/),
    userNameRegex: new RegExp(/^[0-9a-zA-Z-_!?]+$/),
    emailRegex: new RegExp(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)
};
