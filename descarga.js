const http = require('https');
const fse = require('fs-extra');
const html2json = require('html2json').html2json;
//const sanitize = require("sanitize-filename");

const rawdata = fse.readFileSync('autores_y_textos_perseus.json');
const autoresYTextos = JSON.parse(rawdata);


let construyeBibliografia = (bibliografia, entrada) => {
	if (!bibliografia)
		bibliografia=[];
	
	const referencia = html2json(entrada.Field).child[0];

	if (esAutor(referencia)){
		const autor = construyeAutor(referencia);
		bibliografia.push(autor);
		return bibliografia;
		
	} else if (esObra(referencia)){
		const obra = construyeObra(referencia);
		if (obra!=null){
			let autor = bibliografia.pop();
			autor.obras.push(obra);
			bibliografia.push(autor);
		}
		return bibliografia;
	}
}

let esAutor = (referencia) => {
	return referencia.attr.class.includes('authorName');
}
let esObra = (referencia) => {
	return referencia.attr.class.includes('fileName');
}

let construyeAutor = (referencia) => {
	const autor = {"nombre": referencia.child[0].text, "obras": []};
	return autor;
}

let normaliza = (url) => {
	const urlCopy = JSON.parse(JSON.stringify(url));
	return urlCopy.slice(0, -2).slice(15);
}

let construyeObra = (referencia) => {

	if (esOriginal(referencia)){
		const obra = {"nombre": referencia.child[0].text, "url": normaliza(referencia.attr.onclick)};
		return obra;
	}
	return null;
}


const biblio = autoresYTextos.reduce(construyeBibliografia,[]);
const originales = biblio.filter(autor => autor.obras.length > 0);

console.log(originales);

originales.map((autor) => {
	autor.obras.map((obra=>{
		copyFilePerseus(autor,obra);
	}))	
})


function esTraduccion(referencia){
	return normaliza(referencia.attr.onclick).includes("eng1") || normaliza(referencia.attr.onclick).includes("eng2");
}
function esOriginal(referencia){
	return (normaliza(referencia.attr.onclick).includes("grc") || normaliza(referencia.attr.onclick).includes("lat"));
}

function copyFilePerseus(autor,obra){
				
	const nameFile = "textos/" + autor.nombre + "/" + obra.nombre + ".xml";
	//nameFile.replace("(",' ').replace(")",' ').replace("?",' ');
	
	if (!fse.existsSync(nameFile)){
		console.log("---------BUSCO------------");

		try{
			
			fse.outputFileSync(nameFile, '');

			const request = http.get("https://d.iogen.es/static/" + obra.url, function(response) {

				if (response.statusCode != 200) {
				  console.log("non-200 response status code:", response.statusCode);
				  console.log("for url:", "https://d.iogen.es/static/" + obra.url);
				  return;
				}
			
				const file = fse.createWriteStream(nameFile);
				response.pipe(file);
				file.on('finish', function() {
					file.close(function(){console.log("Guardado " + nameFile)});  
				});
			  
			});
			
		} catch(e){
			console.log("-----------ERROR----------",e);
		}
	}

}


