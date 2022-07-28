const { Cluster } = require('puppeteer-cluster');
const pup = require('puppeteer');

const url = "https://www.mercadolivre.com.br/";
const searcFor = "Macbook";

let c = 1;

const list = [];

(async ()=>{
    const browser = await pup.launch({headless: false});
    const page = await browser.newPage();
    console.log('Iniciei');

    await page.goto(url);
    console.log('fui para a URL');

    await page.waitForSelector('#cb1-edit');
    await page.type('#cb1-edit', searcFor);

    //promise necessaria para aguardar navegação de tela
    await Promise.all([
        page.waitForNavigation(),
        page.click('.nav-search-btn')
    ])

    const links = await page.$$eval('.ui-search-result__image > a', el => el.map(link => link.href));

    await browser.close();

    (async () => {
        const cluster = await Cluster.launch({
          concurrency: Cluster.CONCURRENCY_PAGE,
          maxConcurrency: 10,
          monitor: true,
          puppeteerOptions: {
            headless: false,
            defaultViewport: false,
            userDataDir: "./tmp",
          },
        });
      
        cluster.on("taskerror", (err, data) => {
          console.log(`Error crawling ${data}: ${err.message}`);
        });
    
        await cluster.task(async ({ page, data: url }) => {
            await page.goto(url)
            await page.waitForSelector('.ui-pdp-title');
    
            const title = await page.$eval('.ui-pdp-title', el => el.innerText);
            const price = await page.$eval('.andes-money-amount__fraction', el => el.innerText);
    
            const obj = {};
            obj.title = title;
            obj.price = price;
            obj.link = url;
    
            list.push(obj);
        });
    
            for(const link of links){
                if(c === 10) continue;
                await cluster.queue(link);
                c++;
            }
            
            await cluster.idle();
            await cluster.close();

            console.log(list);
    })();

})();

