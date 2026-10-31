import { readFileSync,readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { resourceTables,storefrontSchema } from '../src/lib/supabase-schema.js';
const contract=JSON.parse(readFileSync('supabase/database-contract.json','utf8'));
assert.equal(resourceTables.customers,'profiles');assert.ok(!('customers' in contract));
for(const [resource,table] of Object.entries(resourceTables))assert.ok(contract[table],`${resource} maps to an existing table`);
for(const [table,columns] of Object.entries(storefrontSchema))for(const column of columns)assert.ok(contract[table].columns.some(c=>c.name===column),`${table}.${column} exists`);
function fields(selection){let depth=0,start=0;const result=[];for(let i=0;i<selection.length;i++){if(selection[i]==='(')depth++;if(selection[i]===')')depth--;if(selection[i]===','&&depth===0){result.push(selection.slice(start,i));start=i+1;}}result.push(selection.slice(start));return result.map(s=>s.trim()).filter(Boolean);}
function refers(constraint,target){return constraint.type==='f'&&new RegExp(`REFERENCES (?:public\\.)?"?${target}"?\\s*\\(`).test(constraint.definition);}
function checkSelect(table,selection){
 assert.ok(contract[table],`Selected table ${table} exists`);
 for(const field of fields(selection)){
  if(field==='*')continue;
  const start=field.indexOf('(');
  if(start!==-1){
   const target=field.slice(0,start).split(':').at(-1);
   assert.ok(contract[target],`${table} embeds known table ${target}`);
   const count=contract[table].constraints.filter(c=>refers(c,target)).length+contract[target].constraints.filter(c=>refers(c,table)).length;
   assert.equal(count,1,`${table} -> ${target} has exactly one unambiguous foreign-key relationship`);
   checkSelect(target,field.slice(start+1,-1));
  }else assert.ok(contract[table].columns.some(c=>c.name===field.split(':').at(-1)),`${table}.${field} exists`);
 }
}
const service=readFileSync('src/api/supabase-service.js','utf8');
for(const [table,name] of [['products','productSelect'],['orders','orderSelect']]){
 const selection=service.match(new RegExp(`(?:export )?const ${name} = '([^']+)'`))?.[1];assert.ok(selection,`${name} is available for query auditing`);checkSelect(table,selection);
}
function files(path){return readdirSync(path,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(`${path}/${entry.name}`):/\.(jsx?|ts)$/.test(entry.name)?[`${path}/${entry.name}`]:[]);}
let checked=0;
for(const path of [...files('src'),...files('supabase/functions')]){
 const source=readFileSync(path,'utf8');
 for(const match of source.matchAll(/\.from\('([a-z_]+)'\)\.select\('([^']+)'/g)){checkSelect(match[1],match[2]);checked++;}
}
for(const match of service.matchAll(/resource==='([^']+)'\?'([^']+)'/g))if(resourceTables[match[1]]&&match[2].includes('*'))checkSelect(resourceTables[match[1]],match[2]);
assert.ok(checked>10);
for(const table of Object.values(contract)){
 assert.ok(table.columns.some(c=>c.name==='createdAt'));assert.ok(table.columns.some(c=>c.name==='updatedAt'));
 assert.ok(table.constraints.some(c=>c.type==='p'),'All application tables have a primary key');
}
console.log(`PASS: ${Object.keys(contract).length} canonical tables, ${checked} literal queries, product/order embeds, resource aliases and quoted column names match the migrated PostgreSQL schema.`);
