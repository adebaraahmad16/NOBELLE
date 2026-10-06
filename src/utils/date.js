let preferences={timezone:'Africa/Lagos',dateFormat:'DD/MM/YYYY'};
export function setDatePreferences(value){preferences=value;}
export function formatDate(value,withTime=true){
 if(!value)return 'Not available';const parsed=new Date(value);if(Number.isNaN(parsed.getTime()))return 'Not available';
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:preferences.timezone,day:'2-digit',month:preferences.dateFormat==='DD MMM YYYY'?'short':'2-digit',year:'numeric'}).formatToParts(parsed).map(p=>[p.type,p.value]));
 const result=preferences.dateFormat==='YYYY-MM-DD'?`${parts.year}-${parts.month}-${parts.day}`:preferences.dateFormat==='MM/DD/YYYY'?`${parts.month}/${parts.day}/${parts.year}`:preferences.dateFormat==='DD MMM YYYY'?`${parts.day} ${parts.month} ${parts.year}`:`${parts.day}/${parts.month}/${parts.year}`;
 return withTime?`${result}, ${new Intl.DateTimeFormat('en-GB',{timeZone:preferences.timezone,hour:'2-digit',minute:'2-digit'}).format(parsed)}`:result;
}
