//function to load template gallery pictures 
//js\templates.js
function returnPicture(picture){
    return `<div class="${picture.class}" style="background-image: url(${picture.img});"><a href="${picture.img}" data-lightbox="models" data-title="${picture.title}"></a></div>`;
} 

//function to return gallery buttons

function returnBtn(btn){ 
    return  `<li id="${btn.id}" class="other-link d-inline-block p-2 position-relative"><a href="${btn.link}"><h2 class="link-bold-borders">${btn.name}</h2></a></li>`
}



//functions to load properties for sale /rent (inmobiliaria)

function returnPropertyFeatures(property){
    let features = ``
    property.features.forEach(feature => {
        for (let key in feature) {
            if (feature.hasOwnProperty(key)) {
                features += `<h3 class="model__feature">${feature[key]}</h3>`;
            }
        }
    });
    return features;
}
