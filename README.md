# Developers

<ul>
<li><a href="https://t.me/Yooooooru" target="blank">Малюгов Сергей</a></li>
<li><a href="https://t.me/sijedD" target="blank">Виниченко Данил</a></li>
<li><a href="https://t.me/Kaza_az_az_za" target="blank">Артемьев Роман</a></li>
</ul>

# Links

<ul>
</ul>

## Pre-project setup

1. copy file `.env.example` rename to `.env`;
2. fill in your details
3. run migrations `npm run drizzle:push`
4. run project `npm run start:local`

## Working with the system

### file naming rules

- Interfaces starts with I: `IUser`
- Types ends with Type: `UserType`
- Used `camelCase` for naming

### file naming rules

Used `kebab-case` for files and dirs

### zod schemas naming rules

- actionEntityFastifySchema (insertUserFastifySchema)
- ActionEntityType (InsertUserType)
- IActionEntityFastifySchema (IInsertUserFastifySchema)
- body/params/querySchema

## scripts

```sh
"build": project build
"start:build": run builded project
"code-check": simulate build but without creating directory. Error checking only
"start:local": launch during local development
"drizzle:push": run migrations
```

## Working with git

### branches

The branch is created by the developer's last name and task number.

#### example

`surname/task-123`  
`secondname/task-321`

### commit order

`action(part of the system in which changes have been made): [TASK] what exactly was done`

#### example (only these 4 actions)

`feature(auth): [task-123] add login credentials validation`  
`fix(user-repository): [task-321] fix unique row condition`  
`refactor(core): [task-666] change enum values`  
`modify(core): [task-666] improve logic of validation`
