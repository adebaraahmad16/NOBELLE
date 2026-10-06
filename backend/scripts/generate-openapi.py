import json,re
from pathlib import Path
paths={}
mounts={'auth':'/auth','product':'/products','category':'/categories','collection':'/collections','cart':'/cart','order':'/orders','payment':'/payments','content':'/content','admin':'/admin','adminOperations':'/admin','customer':''}
strprop=lambda: {'type':'string'}
schemas={
 'Login':{'type':'object','required':['email','password'],'properties':{'email':{'type':'string','format':'email'},'password':{'type':'string'}}},
 'Register':{'type':'object','required':['firstName','lastName','email','password','confirmPassword'],'properties':{**{k:strprop() for k in ['firstName','lastName','phone','email','password','confirmPassword']}}},
 'Address':{'type':'object','required':['recipient','phoneNumber','street','city','state'],'properties':{**{k:strprop() for k in ['recipient','phoneNumber','street','city','state','country','postalCode']},'isDefault':{'type':'boolean'}}},
 'Checkout':{'type':'object','required':['idempotencyKey','deliveryZoneId'],'properties':{'idempotencyKey':{'type':'string','format':'uuid'},'deliveryZoneId':{'type':'string','format':'uuid'},'addressId':{'type':'string','format':'uuid'},'shippingAddress':{'$ref':'#/components/schemas/Address'},'couponCode':strprop(),'notes':strprop()}},
 'Product':{'type':'object','required':['name','sku','description','categoryId','price','variants'],'properties':{**{k:strprop() for k in ['name','sku','description','shortDescription','categoryId','collectionId','material','careInstructions']},'price':{'type':'number','minimum':0.01},'comparePrice':{'type':'number','nullable':True},'isActive':{'type':'boolean'},'isFeatured':{'type':'boolean'},'variants':{'type':'array','minItems':1,'items':{'$ref':'#/components/schemas/Variant'}}}},
 'Variant':{'type':'object','required':['sku','size','color'],'properties':{'sku':strprop(),'size':strprop(),'color':strprop(),'quantity':{'type':'integer','minimum':0},'priceDiff':{'type':'number'},'isActive':{'type':'boolean'}}},
 'CartItem':{'type':'object','required':['variantId','quantity'],'properties':{'variantId':{'type':'string','format':'uuid'},'quantity':{'type':'integer','minimum':1}}},
 'PaymentInitialize':{'type':'object','required':['orderId'],'properties':{'orderId':{'type':'string','format':'uuid'}}},
 'Contact':{'type':'object','required':['name','email','subject','message'],'properties':{k:strprop() for k in ['name','email','phone','subject','message']}},
 'Error':{'type':'object','required':['success','message','errors'],'properties':{'success':{'type':'boolean','enum':[False]},'message':strprop(),'errors':{'type':'array','items':{'type':'object'}}}},
 'Response':{'type':'object','properties':{'success':{'type':'boolean'},'data':{},'pagination':{'type':'object','properties':{k:{'type':'integer'} for k in ['page','limit','total','totalPages']}}}},
}
for name,prefix in mounts.items():
 text=Path(f'src/routes/v1/{name}.routes.ts').read_text(encoding='utf-8')
 for method,path in re.findall(r"router\.(get|post|patch|delete)\('([^']+)'",text):
  path=prefix+('' if path=='/' else path); path=re.sub(r':(\w+)',r'{\1}',path)
  public=name in ['product','category','collection','content'] or '/auth/' in path and not path.endswith('/me') or path in ['/contact','/delivery-zones','/newsletter'] or 'webhook' in path
  operation={'summary':f'{method.upper()} {path}','tags':['Admin' if prefix=='/admin' else name.capitalize()], 'security':[] if public else [{'BearerAuth':[]}], 'responses':{'200':{'description':'Successful response','content':{'application/json':{'schema':{'$ref':'#/components/schemas/Response'}}}},**{str(code):{'description':label,'content':{'application/json':{'schema':{'$ref':'#/components/schemas/Error'}}}} for code,label in [(400,'Invalid input or state'),(401,'Authentication required'),(403,'Insufficient permissions'),(404,'Record not found'),(409,'Conflict'),(422,'Validation failed'),(429,'Rate limited'),(500,'Internal error')]}}}
  parameters=[{'name':p,'in':'path','required':True,'schema':{'type':'string'}} for p in re.findall(r'{(\w+)}',path)]
  if method=='get' and not parameters: parameters += [{'name':p,'in':'query','schema':{'type':'integer' if p in ['page','limit'] else 'string'}} for p in ['page','limit','search']]
  if parameters: operation['parameters']=parameters
  schema=None
  if path.endswith('/login'): schema='Login'
  elif path=='/auth/register': schema='Register'
  elif path=='/orders' and method=='post': schema='Checkout'
  elif path=='/admin/products' and method=='post': schema='Product'
  elif 'variants' in path and method in ['post','patch']: schema='Variant'
  elif path=='/cart/items' and method=='post': schema='CartItem'
  elif path.startswith('/addresses') and method in ['post','patch']: schema='Address'
  elif path.endswith('/initialize'): schema='PaymentInitialize'
  elif path=='/contact': schema='Contact'
  if method in ['post','patch']: operation['requestBody']={'required':True,'content':{'application/json':{'schema':{'$ref':f'#/components/schemas/{schema}'} if schema else {'type':'object','description':'Validated fields are defined by the corresponding route validator.'}}}}
  if path.endswith('/images') and method=='post': operation['requestBody']={'required':True,'content':{'multipart/form-data':{'schema':{'type':'object','properties':{'images':{'type':'array','maxItems':10,'items':{'type':'string','format':'binary'}}}}}}}
  paths.setdefault(path,{})[method]=operation
paths['/webhooks/paystack']={'post':{'summary':'Signed Paystack webhook','security':[],'parameters':[{'name':'x-paystack-signature','in':'header','required':True,'schema':{'type':'string'}}],'requestBody':{'required':True,'content':{'application/json':{'schema':{'type':'object'}}}},'responses':{'200':{'description':'Event processed idempotently'},'401':{'description':'Invalid signature'}}}}
paths['/health']={'get':{'summary':'Liveness','security':[],'responses':{'200':{'description':'Application running'}}}}
Path('src/config/openapi.json').write_text(json.dumps({'openapi':'3.0.3','info':{'title':'NOBELLE API','version':'1.0.0','description':'Money is stored as exact NGN decimals. Paystack amounts are integer kobo. Checkout stock is reserved for 30 minutes. Refresh sessions use HttpOnly cookies; serve frontends and API under the same site.'},'servers':[{'url':'/api/v1'}],'paths':paths,'components':{'schemas':schemas,'securitySchemes':{'BearerAuth':{'type':'http','scheme':'bearer','bearerFormat':'JWT'}}}},indent=2),encoding='utf-8')
