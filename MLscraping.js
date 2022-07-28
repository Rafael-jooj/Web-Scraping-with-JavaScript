const { Cluster } = require('puppeteer-cluster');
const pup = require('puppeteer');

const urls = ["https://www.mercadolivre.com.br/apple-macbook-air-13-polegadas-2020-chip-m1-256-gb-de-ssd-8-gb-de-ram-cinza-espacial/p/MLB17828518?pdp_filters=category:MLB1652#searchVariation=MLB17828518&position=1&search_layout=grid&type=product&tracking_id=454ae7c4-2208-415a-8d04-9bf5d7ef6492", "https://www.mercadolivre.com.br/apple-macbook-air-13-polegadas-2020-chip-m1-256-gb-de-ssd-8-gb-de-ram-prateado/p/MLB17828520?pdp_filters=category:MLB1652#searchVariation=MLB17828520&position=2&search_layout=grid&type=product&tracking_id=fd27b9f6-c480-4053-9a05-aaa30f9902ae", "https://www.mercadolivre.com.br/apple-macbook-air-13-polegadas-2020-chip-m1-256-gb-de-ssd-8-gb-de-ram-ouro/p/MLB17828522?pdp_filters=category:MLB1652#searchVariation=MLB17828522&position=3&search_layout=grid&type=product&tracking_id=4e80e72c-14ad-4c29-b325-a45951104aaa"];

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

