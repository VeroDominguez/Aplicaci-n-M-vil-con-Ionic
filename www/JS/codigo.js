const BaseURL="https://calcount.develotion.com";
const BaseImgURL = "https://calcount.develotion.com/imgs/";
const ruteo = document.querySelector("#ruteo");
let paises = new Array();
let alimentos = new Array();
let registrosComidas = new Array();
let usuariosPorPais = new Array();


let latitudDispositivo;
let longitudDispositivo;
let map;
navigator.geolocation.getCurrentPosition(GuardarUbicacion, MostrarError);

Inicializar();

function Inicializar(){
    OcultarPantallas();
    AgregarEventos();
    /*CargarPaisesEnSelect();*/
    if(
        localStorage.getItem("apikey") != null && localStorage.getItem("apikey") !=""
    ){
        ruteo.push("/RegistroComida");
        ruteo.push("/ListadoDeComidas");
        ruteo.push("/ListadoDeComidasPorfechas");
        ruteo.push("/InformeDeCalorias");
        ruteo.push("/UbicacionGeografica");
    }else{
        OcultarMostrarItemsMenu("none");
    }
     
}


function AgregarEventos(){
    ruteo.addEventListener("ionRouteWillChange", Navegar);
    document.querySelector("#btnRegistro").addEventListener("click", Registro);
    document.querySelector("#btnLogin").addEventListener("click", Login);
    document.querySelector("#btnRegistroComida").addEventListener("click", RegistroComida);
    document.querySelector("#btnlistComidaPorFecha").addEventListener("click", RegistrosPorFecha);
    document.querySelector("#btnNumUsuarios").addEventListener("click", BtnPaisesConMasUsuarios);
}

function Navegar(event){
    console.log(event);
    OcultarPantallas();
    switch(event.detail.to){
        case "/Registro":
            CargarPaises();
            setTimeout(() => {
                CargarPaisesEnSelect();
            }, 2000);           
            document.querySelector("#registro").style.display= "block";
            break;
        case "/Login":
            OcultarMostrarItemsMenu("block");
            document.querySelector("#login").style.display= "block";
            break;
        case "/Logout":
            Logout();
            OcultarMostrarItemsMenu("none");
            ruteo.push("/");
            break;
        case "/RegistroComida":
            OcultarMostrarItemsMenu("block");
            CargarAlimentos();
            setTimeout(() => {
                CargarAlimentosEnSelect();
            }, 2000); 
            document.querySelector("#regComida").style.display= "block";
            break;
        case "/ListadoDeComidas":
            OcultarMostrarItemsMenu("block");
            document.querySelector("#listComidasReg").innerHTML = "Cargando ... esto puede tomar unos segundos";
            CargarAlimentos();
            ObtenerComidas();
            setTimeout(() => {
                MostrarTodosLosRegistros();
            }, 8000); 
            document.querySelector("#listadoDeComidas").style.display= "block";
            break;
        case "/ListadoDeComidasPorfechas":
            OcultarMostrarItemsMenu("block");
            document.querySelector("#listadoComidasPorFechas").style.display= "block";
            break;
        case "/InformeDeCalorias":
            OcultarMostrarItemsMenu("block");
            document.querySelector("#msjInformeDeCaloriasTotales").innerHTML = "Cargando ... esto puede tomar unos segundos";
            document.querySelector("#msjInformeDeCaloriasDiarias").innerHTML = "";
            CargarAlimentos();
            ObtenerComidas();
            setTimeout(() => {
                MostrarInformeCalorias();
            }, 8000); 
            document.querySelector("#informeDeCalorias").style.display= "block";
            break;
        case "/UbicacionGeografica":
            OcultarMostrarItemsMenu("block");
            setTimeout(() => {
                CargarMapa();
            }, 3000);
            document.querySelector("#ubicacion").style.display= "block";
            break;
        default:
            document.querySelector("#inicio").style.display= "block";
            break;
    }
}

function OcultarPantallas(){
    let pantallas= document.querySelectorAll(".ion-page");
    for(let i=1; i< pantallas.length; i++){
        pantallas[i].style.display= "none";
    }
}

function CerrarMenu() {
    document.querySelector("#menu").close();
}

function OcultarMostrarItemsMenu(display){
    let itemsDelMenu = document.querySelectorAll(".Logueado");
        for(let i = 0; i < itemsDelMenu.length; i++){
            itemsDelMenu[i].style.display= display;
        } 
} /*esta funcion se agrega para que no vueva a mostrar el loguin una vez que ya está logueado*/

function CargarPaises(){
    let urlPaises= BaseURL + "/paises.php"
//hacer fetch
    fetch(urlPaises, 
        {
        headers: 
        {
            "Content-type": "application/json"
        }
    }).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        else
        {
            return Promise.reject({ codigo: response.status, message: "Datos incorrectos" });
        }
    })
    .then(function (datos) {               
        paises = datos.paises;
   
    })
    .catch(function(Error){
        console.log(Error.message);
    });    
}

function CargarPaisesEnSelect(){
    let paisesSelect = ""
    console.log(paises)
    for(let i= 0; i<paises.length; i++){
        console.log(paises[i])
        paisesSelect += `<ion-select-option value="${paises[i].id}">${paises[i].name}</ion-select-option>`
    }
    document.querySelector("#idPais").innerHTML= paisesSelect;
}

function Registro(){
    let usuario = document.querySelector("#txtUsuario").value;
    let password = document.querySelector("#txtPasswordRegistro").value;
    let pais = document.querySelector("#idPais").value;
    let calorias = document.querySelector("#numCalorias").value;
    try{
        ValidarDatos(usuario, password, pais, calorias);
        let usu={
            usuario: usuario,
            password: password,
            idPais: pais,
            caloriasDiarias: calorias,
        };
        fetch(BaseURL+ "/usuarios.php",{
            method: "POST",
            headers:{
                "Content-type":"application/json"
            },
            body: JSON.stringify(usu),
        })
        .then(function(response){
            return response.json();
        })
        .then(function(datos){
            if(datos.codigo == 200){
                document.querySelector("#mensajeRegistro").innerHTML= "Registro exitoso del usuario " +`${usu.usuario}`;
                LimpiarCampos();
                localStorage.setItem("apikey", datos.apiKey);
                localStorage.setItem("id", datos.id);
                localStorage.setItem("caloriasDiarias", datos.caloriasDiarias);
            }else{
                document.querySelector("#mensajeRegistro").innerHTML= `${datos.mensaje}`;
            }
        })
        .catch(function(Error){
            document.querySelector("#mensajeRegistro").innerHTML= `${Error.message}`;
        });
    }catch(Error) {
        document.querySelector("#mensajeRegistro").innerHTML= `${Error.message}`;
    }
}

function ValidarDatos(usuario, password, pais, calorias){
    if (usuario.trim().length == 0) {
        throw new Error("El nombre de usuario es obligatorio");
    }
    if (password.trim().length == 0) {
        throw new Error("La password es obligatorio");
    }
    if (pais == null) {
        throw new Error("Debe seleccionar un pais");
    }
    if (calorias.trim().length == 0) {
        throw new Error("Ingrese un consumo de calorias diarias");
    }
}

function LimpiarCampos(){
    document.querySelector("#txtUsuario").value= "";
    document.querySelector("#txtPasswordRegistro").value= "";
    document.querySelector("#idPais").value= "";
    document.querySelector("#numCalorias").value= "";
}

function Login(){
    let usuario= document.querySelector("#txtNombreUsuario").value;
    let password= document.querySelector("#txtPassword").value;
    try{
        if(usuario.trim().length== 0 || password.trim().length== 0){
            throw new Error("Usuario y/o password incorrecto");
        }
        fetch(BaseURL + "/login.php",{
            method: "POST",
            headers:{
                "Content-type": "application/json",
            },
            body: JSON.stringify({
                usuario: usuario,
                password: password,
            }),
        })
        .then(function(response){
            if(response.status== 401) {
                return Promise.reject({
                    codigo: response.status,
                    message: "No autorizado",
                })
            }
            return response.json();
        })
        .then(function(datos){
            if(datos.codigo == 200){
                document.querySelector("#mensajeLogin").innerHTML= "Usuario logueado correctamente";
                document.querySelector("#txtNombreUsuario").value= "";
                document.querySelector("#txtPassword").value= "";
                localStorage.setItem("apikey", datos.apiKey);
                localStorage.setItem("id", datos.id);
                localStorage.setItem("caloriasDiarias", datos.caloriasDiarias);
            }else{
                document.querySelector("#mensajeLogin").innerHTML= `${datos.mensaje}`;
            }
        })
        .catch(function(Error){
            document.querySelector("#mensajeLogin").innerHTML= `${Error.message}`;
        });
    }catch(Error){
        document.querySelector("#mensajeLogin").innerHTML= `${Error.message}`;
    }
}

function Logout(){
    localStorage.clear();
}

function CargarAlimentos(){
    let urlAlimentos= BaseURL + "/alimentos.php"
    let apiKey= localStorage.getItem("apikey")
    let iduser= localStorage.getItem("id")
    fetch(urlAlimentos, 
        {
        headers: 
        {
            "Content-type": "application/json",
            "apikey": apiKey,
            "iduser": iduser,
        }
    })
    .then(function (response) {
        if (response.ok) {
            return response.json();
        }
        else
        {
            return Promise.reject({ codigo: response.status, message: "Datos incorrectos" });
        }
    })
    .then(function (datos) {               
       alimentos = datos.alimentos;
    })
    .catch(function (error){               
        console.log(error);
    })  
}

function CargarAlimentosEnSelect(){
    let alimentosSelect = ""
    console.log(alimentos)
    for(let i= 0; i<alimentos.length; i++){
        console.log(alimentos[i])
        alimentosSelect += `<ion-select-option value="${alimentos[i].id}">${alimentos[i].nombre}</ion-select-option>`
    }
    document.querySelector("#idComida").innerHTML= alimentosSelect;
}
// ver funcion de regsitro de comida que no está impactando en el backend
function RegistroComida(){
    let alimento= document.querySelector("#idComida").value;
    let usuario= localStorage.getItem("id");
    let cantidad= document.querySelector("#txtCantidad").value;
    let fecha= document.querySelector("#idFecha").value;
    let apiKey= localStorage.getItem("apikey")
    try{
        ValidarDatosComida(alimento, cantidad, fecha);
        let registro={
            idAlimento: Number(alimento),
            idUsuario: Number(usuario),
            cantidad: Number(cantidad),
            /*fecha: fecha.split('T')[0] //parto la fecha usando T como separador y me quedo con la primer parte solamente*/
            fecha: new Date(fecha).toISOString().split('T')[0],
        };
        console.log("llegue aca");
        console.log(registro.fecha);
        fetch(BaseURL+ "/registros.php",{
            method: "POST",
            headers:{
                "Content-type":"application/json",
                "apikey": apiKey,
                "iduser": usuario,
            },
            body: JSON.stringify(registro),
        })
        .then(function(response){
            return response.json();
        })
        .then(function(datos){
            if(datos.codigo == 200){
                console.log(datos);

                document.querySelector("#msjRegistroComida").innerHTML= datos.mensaje;
                document.querySelector("#idComida").value= "";
                document.querySelector("#txtCantidad").value= "";
                document.querySelector("#idFecha").value= "";
            }else{
                document.querySelector("#msjRegistroComida").innerHTML= `${datos.mensaje}`;
            }
        })
        .catch(function(Error){
            document.querySelector("#msjRegistroComida").innerHTML= `${Error.message}`;
        });
    }catch(Error) {
        document.querySelector("#msjRegistroComida").innerHTML= `${Error.message}`;
    }
}

function ValidarDatosComida(alimento, cantidad, fecha){
    if (alimento == null || alimento == "") {
        throw new Error("Debe seleccionar un alimento");
    }
    if (cantidad == null  || cantidad == "" || isNaN(cantidad) ) {
        throw new Error("Ingrese una cantidad valida");// falta agregar la valiidación para el subfijo
    }
    if (fecha == null || fecha == "") {
        throw new Error("Debe seleccionar una fecha válida, revise el selector de fechas. (Hay un error de Ionic y si no los mueve al menos una vez no toma la fecha seleccionada)");
    }

    let fechaConvertida = new Date(fecha)
    let fechaActual = new Date()
    if(fechaConvertida > fechaActual) {
        throw new Error("La fecha no puede ser posterior a hoy");
    }
}

function ObtenerComidas(){
    let apiKey= localStorage.getItem("apikey")
    let iduser= localStorage.getItem("id")
    let urlRegComidas= BaseURL + "/registros.php?idUsuario=" + iduser;
    fetch(urlRegComidas, 
        {
        headers: 
        {
            "Content-type": "application/json",
            "apikey": apiKey,
            "iduser": iduser,
        }
    })
    .then(function (response) {
        if (response.ok) {
            return response.json();
        }
        else
        {
            return Promise.reject({ codigo: response.status, message: "Debes iniciar sesión para visualizar el listado", });
        }
    })
    .then(function (datos) {   
        console.log(datos)            
        registrosComidas = datos.registros;
    })
    .catch(function (error){               
        console.log(error);
    })  
}

function CalcularCaloriasConsumidas(consumido, caloriasPorPorcion, porcion){
    let calorias = Number(consumido) * Number(caloriasPorPorcion) / Number(LimpiarPorcion(porcion));
    return Number(calorias.toFixed(2)) //para que use solo 2 cifras despues de la coma
}

function LimpiarPorcion(porcion){
    return porcion.substring(0, porcion.length - 1);
}

function MostrarTodosLosRegistros(){

    document.querySelector("#listComidasReg").innerHTML = "Cargando ... esto puede tomar unos segundos";

    console.log(registrosComidas)
    
    if(registrosComidas.length > 0)
    {
        let combinado = new Array();
        for (let i = 0; i < registrosComidas.length; i++){
            for (let j = 0; j < alimentos.length; j++){
                if(registrosComidas[i].idAlimento == alimentos[j].id){
                    combinado.push({
                    "idRegistro":registrosComidas[i].id,
                    "idAlimento":registrosComidas[i].idAlimento,
                    "nombreAlimento":alimentos[j].nombre,
                    "caloriasPorPorcion":alimentos[j].calorias,
                    "porcion":alimentos[j].porcion,
                    "imagen":alimentos[j].imagen,
                    "idUsuario":registrosComidas[i].idUsuario,
                    "fecha":registrosComidas[i].fecha,
                    "cantidad":registrosComidas[i].cantidad,
                    "caloriasConsumidas": CalcularCaloriasConsumidas(registrosComidas[i].cantidad, alimentos[j].calorias,alimentos[j].porcion)
                })
            }
        }
    }

    let datosCombinados = "";
    for (let i = 0; i < combinado.length; i++){
        datosCombinados += `<ion-card>
            <img alt="${combinado[i].nombreAlimento}" 
            src="${BaseImgURL}${combinado[i].imagen}.png" />
            <ion-card-header>
            <ion-card-title>Alimento consumido: ${combinado[i].nombreAlimento}</ion-card-title>   
            </ion-card-header>
            <ion-card-content>
            <p>Cantidad consumido: ${combinado[i].cantidad}</p>
            <p>Calorías totales: ${combinado[i].caloriasConsumidas}</p>
            <p>Fecha: ${combinado[i].fecha}</p>
            <ion-button onclick='Borrar("${combinado[i].idRegistro}")'>Borrar</ion-button>
            </ion-card-content>
            </ion-card>`;
    }

    document.querySelector("#listComidasReg").innerHTML = datosCombinados;
    }
    else
    {
        document.querySelector("#listComidasReg").innerHTML = "No se encontraron registros de comida";
    }
    
}

function Borrar(idRegistro){

    

    let apiKey= localStorage.getItem("apikey")
    let iduser= localStorage.getItem("id")
    let urlDelete= BaseURL + "/registros.php?idRegistro=" + idRegistro;
   
    fetch(urlDelete, {
        method: "DELETE",
        headers: 
        {
            "Content-type": "application/json",
            "apikey": apiKey,
            "iduser": iduser,
        }
    })
    .then(function (response) {
        if (response.ok) {
            return response.json();
        }
        else
        {
            return Promise.reject({ codigo: response.status, message: "Debes iniciar sesión para visualizar el listado", });
        }
    })
    .then(function (datos) {  
        if(datos.codigo == 200){

            //Creo un alert
            const alert = document.createElement('ion-alert');
            alert.header = 'Borrado';
            //alert.subHeader = 'A Sub Header Is Optional';
            alert.message = datos.mensaje;
            alert.buttons = ['Ok'];

            document.body.appendChild(alert);
            alert.present();

            //cargo de nuevo la lista de comidas
            document.querySelector("#listComidasReg").innerHTML = "Cargando ... esto puede tomar unos segundos";
            CargarAlimentos();
            ObtenerComidas();
            setTimeout(() => {
                MostrarTodosLosRegistros();
            }, 8000); 


        }else{
            document.querySelector("#msjRegistroComida").innerHTML= `${datos.mensaje}`;
        } 
        
    })
    .catch(function (error){               
        console.log(error);
    })  

}

function RegistrosPorFecha(){


    let fecha1= document.querySelector("#idFecha1").value;
    let fecha2= document.querySelector("#idFecha2").value;
    
    if(fecha1 == null || fecha1 == "" || fecha2 == null || fecha2 == ""){
        document.querySelector("#msjlistComidaPorFecha").innerHTML = "Fechas incorrectas, revise el selector de fechas. (Hay un error de Ionic y si no los mueve al menos una vez no toma la fecha seleccionada)";
    }else{
        CargarAlimentos();
        ObtenerComidas();
        document.querySelector("#msjlistComidaPorFecha").innerHTML = "Cargando ... esto puede tomar unos segundos";
    
        setTimeout(() => {
            MostrarRegistrosPorFecha();
        }, 8000);
    }
}


function MostrarRegistrosPorFecha(){

    let fecha1= document.querySelector("#idFecha1").value;
    let fecha2= document.querySelector("#idFecha2").value;
    document.querySelector("#msjlistComidaPorFecha").innerHTML = "Cargando ... esto puede tomar unos segundos";
    
    if(registrosComidas.length > 0)
    {
        let combinado = new Array();
        for (let i = 0; i < registrosComidas.length; i++){
            for (let j = 0; j < alimentos.length; j++){
                if(registrosComidas[i].idAlimento == alimentos[j].id && registrosComidas[i].fecha>= fecha1 && registrosComidas[i].fecha<= fecha2){
                    combinado.push({
                    "idRegistro":registrosComidas[i].id,
                    "idAlimento":registrosComidas[i].idAlimento,
                    "nombreAlimento":alimentos[j].nombre,
                    "caloriasPorPorcion":alimentos[j].calorias,
                    "porcion":alimentos[j].porcion,
                    "imagen":alimentos[j].imagen,
                    "idUsuario":registrosComidas[i].idUsuario,
                    "fecha":registrosComidas[i].fecha,
                    "cantidad":registrosComidas[i].cantidad,
                    "caloriasConsumidas": CalcularCaloriasConsumidas(registrosComidas[i].cantidad, alimentos[j].calorias,alimentos[j].porcion)
                })
            }
        }
    }
    let datosCombinadosPorfecha = "";

    for (let i = 0; i < combinado.length; i++){
        datosCombinadosPorfecha += `<ion-card>
            <img alt="${combinado[i].nombreAlimento}" 
            src="${BaseImgURL}${combinado[i].imagen}.png" />
            <ion-card-header>
            <ion-card-title>Alimento consumido: ${combinado[i].nombreAlimento}</ion-card-title>   
            </ion-card-header>
            <ion-card-content>
            <p>Cantidad consumido: ${combinado[i].cantidad}</p>
            <p>Calorías totales: ${combinado[i].caloriasConsumidas}</p>
            <p>Fecha: ${combinado[i].fecha}</p>
            </ion-card-content>
            </ion-card>`;
    }

    document.querySelector("#msjlistComidaPorFecha").innerHTML = datosCombinadosPorfecha;
    }
    else
    {
        document.querySelector("#msjlistComidaPorFecha").innerHTML = "No se encontraron registros de comida en las fechas indicadas";
    }
    
}

function MostrarInformeCalorias(){

    document.querySelector("#msjInformeDeCaloriasTotales").innerHTML = "Cargando ... esto puede tomar unos segundos";
    document.querySelector("#msjInformeDeCaloriasDiarias").innerHTML = "";

    console.log(registrosComidas)
    
    if(registrosComidas.length > 0)
    {
        let combinado = new Array();
        for (let i = 0; i < registrosComidas.length; i++){
            for (let j = 0; j < alimentos.length; j++){
                if(registrosComidas[i].idAlimento == alimentos[j].id){
                    combinado.push({
                    "idRegistro":registrosComidas[i].id,
                    "idAlimento":registrosComidas[i].idAlimento,
                    "nombreAlimento":alimentos[j].nombre,
                    "caloriasPorPorcion":alimentos[j].calorias,
                    "porcion":alimentos[j].porcion,
                    "imagen":alimentos[j].imagen,
                    "idUsuario":registrosComidas[i].idUsuario,
                    "fecha":registrosComidas[i].fecha,
                    "cantidad":registrosComidas[i].cantidad,
                    "caloriasConsumidas": CalcularCaloriasConsumidas(registrosComidas[i].cantidad, alimentos[j].calorias,alimentos[j].porcion)
                })
            }
        }
    }

    let caloriasTotales = 0;
    let caloriasDiarias = 0;
    let fechaActual = new Date().toISOString().split('T')[0]

    for (let i = 0; i < combinado.length; i++){
        caloriasTotales += Number(combinado[i].caloriasConsumidas);
        if(combinado[i].fecha == fechaActual)
        {
            caloriasDiarias += Number(combinado[i].caloriasConsumidas)
        }
    }

    let caloriasDiariasDelUsuario = localStorage.getItem("caloriasDiarias");
    
    //Muestro el total en un div
    document.querySelector("#msjInformeDeCaloriasTotales").innerHTML = "Calorias totales consumidas: " + caloriasTotales.toFixed(2);


    //Muestro solo las diarias con color en otro div
    if(caloriasDiarias > caloriasDiariasDelUsuario){
        document.querySelector("#msjInformeDeCaloriasDiarias").innerHTML = '<ion-text color="danger">Calorias consumidas hoy: ' + caloriasDiarias.toFixed(2) + '</ion-text>'
    }
    else if(caloriasDiarias < caloriasDiariasDelUsuario && caloriasDiarias >= caloriasDiariasDelUsuario*0.9)
    {
        document.querySelector("#msjInformeDeCaloriasDiarias").innerHTML = '<ion-text color="warning">Calorias consumidas hoy: ' + caloriasDiarias.toFixed(2) + '</ion-text>'
    }
    else{
        document.querySelector("#msjInformeDeCaloriasDiarias").innerHTML = '<ion-text color="success">Calorias consumidas hoy: ' + caloriasDiarias.toFixed(2) + '</ion-text>'
    }

    }
    else
    {
        document.querySelector("#msjInformeDeCaloriasTotales").innerHTML = "No se encontraron registros de comida";
    }
}

function GuardarUbicacion(geolocation) {
    latitudDispositivo = geolocation.coords.latitude;
    longitudDispositivo = geolocation.coords.longitude;
}

function MostrarError(Error){
    console.log(Error);
}

function CargarMapa() {
    
    map = L.map("map").setView(
      [latitudDispositivo, longitudDispositivo],
      13
    );
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    L.marker([latitudDispositivo,longitudDispositivo]).addTo(map);
}

function ObtenerUsuariosPorPais(){
    let urlUsuariosPorPais= BaseURL + "/usuariosPorPais.php"
    let apiKey= localStorage.getItem("apikey")
    let iduser= localStorage.getItem("id")
    fetch(urlUsuariosPorPais, 
        {
        headers: 
        {
            "Content-type": "application/json",
            "apikey": apiKey,
            "iduser": iduser
        }
    }).then(function (response) {
        
        if (response.ok) {
            return response.json();
        }
        else
        {
            return Promise.reject({ codigo: response.status, message: "No se encontraron paises" });
        }
    })
    .then(function (datos) {               
        usuariosPorPais = datos.paises;
    })
    .catch(function(Error){
        console.log(Error.message);
    });      
}

function BtnPaisesConMasUsuarios(){
    
    let cantidad = document.querySelector("#numUsuarios").value;
    console.log(cantidad)
    if(cantidad != null && cantidad >= 0){
        document.querySelector("#mensajeNumUsuarios").innerHTML = "Cargando datos de paises ... esto puede tomar unos segundos";
        CargarPaises();
        ObtenerUsuariosPorPais();

        setTimeout(() => {
            MostrarPaisesConMasUsuarios();
        }, 8000);
    }
    else{
        document.querySelector("#mensajeNumUsuarios").innerHTML = "Debe ingresar un numero válido";
    }
    
}

function MostrarPaisesConMasUsuarios(){
    //document.querySelector("#mensajeNumUsuarios").innerHTML = "Cargando datos de paises ... esto puede tomar unos segundos";
    console.log("entro")
    let combinado = new Array();
    for (let i = 0; i < paises.length; i++){
        for (let j = 0; j < usuariosPorPais.length; j++){
            if(paises[i].id == usuariosPorPais[j].id){
                    combinado.push({
                    "id":paises[i].id,
                    "nombre":paises[i].name,
                    "latitud":paises[i].latitude,
                    "longitud":paises[i].longitude,
                    "cantidadDeUsuarios":usuariosPorPais[j].cantidadDeUsuarios,
                })
            }
        }
    }

    let cantidad = document.querySelector("#numUsuarios").value;
    let paisesConMas = new Array();

    //los recorro para buscarlos y saber si al menos existe uno con esa cantidad de usuarios
    for (let l = 0; l < combinado.length; l++){
        if(combinado[l].cantidadDeUsuarios > cantidad){
            paisesConMas.push(combinado[l])
        }
    }

    if(paisesConMas.length == 0){
        document.querySelector("#mensajeNumUsuarios").innerHTML = "No se encontraron paises que tengan mas de " + cantidad + " usuarios.";
    }
    else
    {
        let mensaje = "Los paises con mas de " + cantidad + " usuarios son:<br>";

        if(map!=null){
            map.remove();
        }
        CargarMapa();
        
        for (let l = 0; l < paisesConMas.length; l++){
            mensaje += paisesConMas[l].nombre + "<br>";
            L.marker([paisesConMas[l].latitud,paisesConMas[l].longitud]).addTo(map)
        }

        map.setView(
            [latitudDispositivo, longitudDispositivo],
            1
          );
        document.querySelector("#mensajeNumUsuarios").innerHTML = mensaje;
        document.querySelector("#numUsuarios").value= "";
    }

}

