const conversationAvatarName = document.getElementById("conversationAvatarName");
const conversationsList = document.getElementById("conversationsList");
const searchConversation = document.getElementById("searchConversation");

const modal = document.getElementById("newConversationModal");
const openModalBtn = document.getElementById("openNewConversationModal");
const closeModalBtn = document.getElementById("closeNewConversationModal");
const usersList = document.getElementById("usersList");

const conversationAvatarModal =
  document.getElementById("conversationAvatarModal");

const conversationBigAvatar =
  document.getElementById("conversationBigAvatar");

const closeConversationAvatarModal =
  document.getElementById("closeConversationAvatarModal");


let conversations = [];
let activeConversationId = null;


// ===============================
// UTILITAIRES
// ===============================

function safeJsonParse(value) {
  try {
    if (!value || value === "undefined") return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
}


function getCurrentUser() {
  return safeJsonParse(localStorage.getItem("user"));
}


function getInitials(name) {
  if (!name) return "KC";

  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}



function getConversationName(conversation) {
  return conversation.name || "Conversation";
}



function getConversationAvatar(conversation) {

  const currentUser = getCurrentUser();

  const participant = conversation.participants?.find(
    item => item.user?.id !== currentUser?.id
  );

  return participant?.user?.avatarUrl || null;
}



function getLastMessage(conversation) {

  if (conversation.lastMessage?.content) {
    return conversation.lastMessage.content;
  }


  if (conversation.messages?.length) {

    return conversation.messages[
      conversation.messages.length - 1
    ].content;
  }


  return "Aucun message pour le moment";
}



function getLastMessageTime(conversation) {

  let date =
    conversation.lastMessage?.createdAt ||
    conversation.messages?.[
      conversation.messages.length - 1
    ]?.createdAt;


  if (!date) return "";


  return new Date(date).toLocaleTimeString("fr-FR", {
    hour:"2-digit",
    minute:"2-digit"
  });
}



// ===============================
// MODAL PHOTO
// ===============================


function openConversationAvatar(avatarUrl, initials, name){
    conversationAvatarName.textContent = name;

  if(avatarUrl){

    conversationBigAvatar.innerHTML = `
      <img 
      src="${avatarUrl}"
      alt="${name}"
      class="w-full h-full object-cover">
    `;

  }else{

    conversationBigAvatar.innerHTML = initials;

  }


  conversationAvatarModal.classList.remove("hidden");
  conversationAvatarModal.classList.add("flex");
}



closeConversationAvatarModal?.addEventListener("click",()=>{

  conversationAvatarModal.classList.add("hidden");
  conversationAvatarModal.classList.remove("flex");

});



conversationAvatarModal?.addEventListener("click",(event)=>{

 if(event.target === conversationAvatarModal){

   conversationAvatarModal.classList.add("hidden");
   conversationAvatarModal.classList.remove("flex");

 }

});



// ===============================
// AFFICHAGE CONVERSATIONS
// ===============================


function renderConversations(list){

 conversationsList.innerHTML="";


 if(!list.length){

   conversationsList.innerHTML=
   `
   <p class="p-4 text-sm text-slate-500">
   Aucune conversation trouvée.
   </p>
   `;

   return;
 }



 list.forEach(conversation=>{


 const name=getConversationName(conversation);

 const avatarUrl=getConversationAvatar(conversation);

 const initials=getInitials(name);

 const lastMessage=getLastMessage(conversation);

 const time=getLastMessageTime(conversation);



 const article=document.createElement("article");


 article.className =
 activeConversationId===conversation.id

 ? "p-4 border-b bg-blue-50 cursor-pointer"

 : "p-4 border-b hover:bg-blue-50 cursor-pointer";




 article.innerHTML=
 `

 <div class="flex gap-3 items-center">


 <div 
 onclick="event.stopPropagation();
 openConversationAvatar('${avatarUrl || ""}','${initials}','${name}')"


 class="w-12 h-12 rounded-full bg-blue-100 
 overflow-hidden flex items-center justify-center 
 font-bold text-blue-700 cursor-pointer hover:scale-110 transition">


 ${
   avatarUrl

   ?

   `
   <img 
   src="${avatarUrl}"
   class="w-full h-full object-cover">
   `

   :

   initials
 }


 </div>



 <div class="flex-1 min-w-0">

 <div class="flex justify-between">

 <h3 class="font-semibold truncate">
 ${name}
 </h3>


 <span class="text-xs text-blue-500">
 ${time}
 </span>

 </div>



 <p class="text-sm text-slate-500 truncate">

 ${lastMessage}

 </p>


 </div>



 </div>


 `;



 article.addEventListener("click",()=>{


 activeConversationId=conversation.id;


 document.getElementById("chatName")
 .textContent=name;



 const chatAvatar=document.getElementById("chatAvatar");


 if(avatarUrl){


 chatAvatar.innerHTML=
 `
 <img src="${avatarUrl}"
 class="w-full h-full object-cover">
 `;


 }else{


 chatAvatar.innerHTML=initials;


 }



 renderConversations(conversations);



 if(typeof window.loadMessages==="function"){


 window.loadMessages(conversation.id);


 }


 });


 conversationsList.appendChild(article);



 });



}



// ===============================
// CHARGEMENT API
// ===============================


async function loadConversations(){

try{


 const response=await fetch(`${API_URL}/conversations`,{

 method:"GET",

 headers:getAuthHeaders(),

 cache:"no-store"

 });



 const result=await response.json();



 conversations=result.data?.conversations || [];


 renderConversations(conversations);



}catch(error){


 conversationsList.innerHTML=
 `
 <p class="p-4 text-red-500">
 Erreur chargement conversations
 </p>
 `;


}



}



window.loadConversations=loadConversations;




// ===============================
// RECHERCHE
// ===============================



searchConversation?.addEventListener("input",()=>{


 const value=searchConversation.value.toLowerCase();



 const result=conversations.filter(item=>

 getConversationName(item)
 .toLowerCase()
 .includes(value)


 );



 renderConversations(result);


});



loadConversations();
