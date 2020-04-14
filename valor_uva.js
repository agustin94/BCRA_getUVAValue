#!/usr/bin/node


const puppeteer = require('puppeteer')
const fs = require('fs')
const retry = require('async-retry')
const dateObj = new Date()
const actualMonth = dateObj.getUTCMonth() + 1
let actualDay = dateObj.getUTCDate() 
const actualYear = dateObj.getUTCFullYear()

const URL_BCRA_UVA = 'http://www.bcra.gov.ar/PublicacionesEstadisticas/Principales_variables_datos.asp?serie=7913&detalle=Unidad%20de%20Valor%20Adquisitivo%20(UVA)%A0(en%20pesos%20-con%20dos%20decimales-,%20base%2031.3.2016=14.05)'

const processParams = {
    fechaDesde: process.argv[2],
    fechaHasta: process.argv[3]
}


const ordenarFecha = async() =>{
    return new Promise(async function(resolve, reject) {
        try{
            console.log(processParams.fechaDesde)
            console.log(processParams.fechaHasta)
            //////////////////////////////FECHA DESDE///////////////////////////////////////
            let monthDesde
            let yearDesde
            const fechaDesde = processParams.fechaDesde.split('-')
            const dayDesde = fechaDesde[0]
            monthDesde = fechaDesde[1]
            yearDesde = fechaDesde[2]

            if (yearDesde.length == 2){
                yearDesde = "20"+yearDesde
            }

            if (yearDesde > actualYear){
                console.log("Año posterior al actual")
                process.exit()
            }else if(monthDesde > actualMonth && yearDesde == actualYear){
                console.log("Mes posterior al actual")
                process.exit()
            }else{
                if (dayDesde > actualDay && monthDesde == actualMonth && yearDesde == actualYear ){
                    console.log("Dia adelantado al de la fecha")
                    process.exit()
                }
            }

            console.log(monthDesde)
            console.log(dayDesde)
            console.log(yearDesde)
            //////////////////////////////FECHA HASTA///////////////////////////////////////
            let monthHasta
            let yearHasta
            const fechaHasta = processParams.fechaHasta.split('-')
            const dayHasta = fechaHasta[0]
            monthHasta = fechaHasta[1]
            yearHasta = fechaDesde[2]

            if (yearHasta.length == 2){
                yearHasta = "20"+yearHasta
            }

            if (yearHasta > actualYear){
                console.log("Año posterior al actual")
                process.exit()
            }else if(monthHasta > actualMonth && yearHasta == actualYear){
                console.log("Mes posterior al actual")
                process.exit()
            }else{
                if (dayHasta > actualDay && monthHasta == actualMonth && yearHasta == actualYear ){
                    console.log("Dia adelantado al de la fecha")
                    process.exit()
                }
            }

            console.log(monthHasta)
            console.log(dayHasta)
            console.log(yearHasta)


        await retry(async bail => {
            await processDataRequest(dayDesde, monthDesde, yearDesde,dayHasta,monthHasta,yearHasta)
        })

        }catch(err){
            console.log("Fallo")
            console.log(err)
            logErrorAndExit(true)
            throw new Error(err)
        }
    })
}


const dataOutput = async () => {
    return new Promise(async function(resolve, reject) {
        try {
            await page.waitForSelector('body > div > div.contenido > div > div > div > div > table > thead > tr')
            let columnDataUva = await page.$$('body > div > div.contenido > div > div > div > div > table > tbody > tr')
            

            let positionInColumns
            let lenghtColumnsInTable = (await page.$$('body > div > div.contenido > div > div > div > div > table > tbody > tr')).length
            for (positionInColumns = 0; positionInColumns < lenghtColumnsInTable; positionInColumns++) {
                let dataUVA = await page.evaluate(columnDataUva => columnDataUva.innerText, columnDataUva[positionInColumns])
                let separateDataUVA  = dataUVA.split('	')
                let fechaTabla = separateDataUVA[0]
                let valorTabla = separateDataUVA[1]
                console.log(fechaTabla+'  '+valorTabla)
                const putJSONData = JSON.stringify({
                     'Fecha':fechaTabla, 
                     'Valor':valorTabla
                })
                
                fs.appendFileSync('C:\\deploys\\valor_uva\\'+'valor_uva-'+processParams.fechaDesde+'hasta'+processParams.fechaHasta+'.json',putJSONData)

            }   
                //browser.close()
        } catch (err) {
            console.log(err)
            reject(err)
        }
    })
}
 

const processDataRequest = async (dayDesde, monthDesde, yearDesde,dayHasta,monthHasta,yearHasta) => {
    return new Promise(async function(resolve, reject) {
           try {

            await page.waitForSelector('body > div > div.contenido > div > div > div > div > form > input[type=date]:nth-child(3)')
           // await page.click('body > div > div.contenido > div > div > div > div > form > input[type=date]:nth-child(3)')

            await page.type('body > div > div.contenido > div > div > div > div > form > input[type=date]:nth-child(3)',dayDesde)
            await page.type('body > div > div.contenido > div > div > div > div > form > input[type=date]:nth-child(3)',monthDesde)
            await page.type('body > div > div.contenido > div > div > div > div > form > input[type=date]:nth-child(3)',yearDesde)

            await page.waitForSelector('body > div > div.contenido > div > div > div > div > form > input[type=date]:nth-child(4)')
            
            await page.type('body > div > div.contenido > div > div > div > div > form > input[type=date]:nth-child(4)',dayHasta)
            await page.type('body > div > div.contenido > div > div > div > div > form > input[type=date]:nth-child(4)',monthHasta)
            await page.type('body > div > div.contenido > div > div > div > div > form > input[type=date]:nth-child(4)',yearHasta)

            await page.waitForSelector('body > div > div.contenido > div > div > div > div > form > button')
            await page.click('body > div > div.contenido > div > div > div > div > form > button')


        
            try {
                const result = await dataOutput()
                resolve(result)
            } catch (err) {
                reject(err.message)
            }
            
            }catch(err){
            //browser.close()
                console.log("Fallo")
                console.log(err)
                logErrorAndExit(true)
                throw new Error(err)
                
            }

                    
    })
}

const preparePage = async () => {
    browser = await puppeteer.launch({
         headless: false,
        //headless: true,
        args: [
            '--no-sandbox',
            '--disable-features=site-per-process',
            '--disable-gpu',
            '--window-size=1920x1080',
        ]
    })
    viewPort = {
        width: 1300,
        height: 900
    }

    page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36');
    await page.setViewport(viewPort)
    await page.setDefaultNavigationTimeout(20000)
    await page.setDefaultTimeout(20000)

    await page.goto(URL_BCRA_UVA, {
        waitUntil: 'networkidle0'
    })

}

const run = async () => {
    console.log(processParams)
    // preparo el navegador e ingreso al sistema
    await retry(async bail => {
        // if anything throws, we retry
        await preparePage()
    }, {
        retries: 5,
        onRetry: async err => {
            console.log(err)
            console.log('Retrying...')
            await page.close()
            await browser.close()
        }
    })

    try {
        console.log('primer try...')
        const processResult = await ordenarFecha()
        logSuccessAndExit(processResult)
    } catch (err) {
        console.log(err)
        throw new Error(err)
    }
}

const logErrorAndExit = async error => {
    //const resultChangeStatus = await updateJobResult(processParams.job_id, 'error', null, error)
    console.log(JSON.stringify({
        state: 'failure',
     /* job_id: processParams.job_id,
        job_type: processParams.job_type,
        job_status: 'error',
        job_data: null,
        job_error: error*/

    }))

    process.exit()
}

const logSuccessAndExit = async resultData => {
    //const resultChangeStatus = await updateJobResult(processParams.job_id, 'finished', resultData, null)
    console.log(JSON.stringify({
        state: 'normal',
            /*data: {
            job_id: processParams.job_id,
            job_type: processParams.job_type,
            job_status: 'finished',
            job_data: resultData,
            job_error: null
        }*/

    }))

    process.exit()
}
run().catch(logErrorAndExit)