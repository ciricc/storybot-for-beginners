const {addNewBot, botController} = require('./src/addNewBot');
const {Utils} = require('storybot');

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const BOTS_PATH = path.join(__dirname, 'bots');
const ACCOUNTS_PATH = path.join(__dirname, 'accounts');

async function main () {
  let botsFiles = fs.readdirSync(BOTS_PATH);
  let accountsFiles = fs.readdirSync(ACCOUNTS_PATH);

  let botConfigs = [];
  let accountsConfigs = {};

  botsFiles.forEach(botFile => {
    let botConfig = fs.readFileSync(path.join(BOTS_PATH, botFile), 'utf8');
    botConfig = YAML.parse(botConfig);
    botConfigs.push(botConfig);
  })

  accountsFiles.forEach(accountFile => {
    let accountConfig = fs.readFileSync(path.join(ACCOUNTS_PATH, accountFile), 'utf8');
    accountConfig = JSON.parse(accountConfig.toString());
    let accountName = accountFile.replace(/\.json/, "");
    accountsConfigs[accountName] = accountConfig;
  })

  // Получаем итоговый список аккаунтов, чтоб уже получить список токенов
  for (let config of botConfigs) {
    if (config.accounts && Object.keys(config.accounts)) {
      for (let accountName in config.accounts) {
        let account = config.accounts[accountName];
        if (!accountsConfigs[accountName] || (accountsConfigs[accountName] && (account.reauth || accountsConfigs[accountName].username != account.username || accountsConfigs[accountName].password != account.password))) {
          accountsConfigs[accountName] = {
            ...accountsConfigs[accountName],
            ...account
          };
        }
      }
    }
  }

  let accounts = Object.keys(accountsConfigs);

  // Получаем токены аккаунтов
  for (let accountName of accounts) {
    let account = accountsConfigs[accountName];
    if (!account.token || (account.token && account.reauth)) {
      console.log('Получаем новый токен ...', accountName)
      let token = await Utils.getToken(account.username, account.password, './lastToken.txt', false);
      if (!token) return;
      accountsConfigs[accountName].token = token;
    }
  }

  for (let accountName in accountsConfigs) {
    let account = accountsConfigs[accountName];
    botConfigs.map((config) => {
      
      if (config.viewers && Object.keys(config.viewers).length) {
        for (let viewerName in config.viewers) {
          let viewer = config.viewers[viewerName];
          if (typeof viewer.account === "string") {
            if (accountName === viewer.account) {
              config.viewers[viewerName].account = {
                access_token: account.token 
              }
            }
          } 
        }
      }

      config.viewers = Object.values(config.viewers);

      if (config.collector && Array.isArray(config.collector.tokens)) {
        config.collector.tokens.forEach((token, i) => {
          if (token === accountName) {
            config.collector.tokens[i] = account.token;
          }
        })
      }

      return config;
    });
  }

  for (let accountName in accountsConfigs) {
    let account = accountsConfigs[accountName];
    fs.writeFileSync(path.join(ACCOUNTS_PATH, accountName + '.json'), JSON.stringify(account), 'utf8');
  }

  for (let config of botConfigs) {
    await addNewBot(config);
  }

  await botController.startBots();

  console.log('Скрипт запущен!');

}

main();