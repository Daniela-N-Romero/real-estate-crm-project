const inmobiliariabtns = document.getElementById("inmobiliariabtns");

function loadButtons(buttons,container){
    container.innerHTML = buttons
}

//template for redirect buttons

buttonsInmobiliaria =  `<a href="https://api.whatsapp.com/send?phone=5491111111111" class="fixed-btn wsp-btn" target="_blank"><i class="bi bi-whatsapp"></i></a>`;
                

if (inmobiliariabtns){
    loadButtons(buttonsInmobiliaria,inmobiliariabtns)
};

