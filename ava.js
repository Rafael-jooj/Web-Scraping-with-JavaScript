const pup = require('puppeteer');
require('dotenv').config()

const url = "https://ava.uft.edu.br/palmas/login/index.php";
const name = process.env.USER_ENV;
const password = process.env.PASSWORD_ENV;

(async ()=>{
    const browser = await pup.launch({headless: false});
    const page = await browser.newPage();
    console.log('Iniciei');

    await page.goto(url);
    console.log('fui para a URL');

    await page.waitForSelector('#username');
    await page.type('#username', name);
    await page.type('#password', password)

    //Promise necessária para aguardar navegação de tela
    await Promise.all([
        page.waitForNavigation(),
        page.click('#loginbtn')
    ])

    await page.waitForTimeout(3000);

    await page.goto('https://ava.uft.edu.br/palmas/login/logout.php');
    await Promise.all([
        page.click("button[type=submit]"),
        page.waitForNavigation()
    ]);
    await browser.close();

    await browser.close();
})();