const MODEL = "gpt-5.6-luna";

const FIELDS = {
  attack:"攻擊力", defense:"防禦力", max_hp:"最大HP", max_mp:"最大MP",
  crit_rate:"暴擊率", crit_damage:"暴擊傷害", attack_speed:"攻擊速度",
  strength:"力量", dexterity:"敏捷", intelligence:"智力", luck:"幸運",
  attribute_ratio_damage:"屬性比例傷害", mp_regen:"每秒恢復MP",
  damage_reduction:"所受傷害減少", damage:"傷害",
  damage_amplification:"傷害增幅", basic_attack_damage:"基本攻擊傷害",
  skill_damage:"技能傷害", defense_penetration:"防禦穿透力",
  boss_damage:"BOSS怪物傷害", normal_monster_damage:"一般怪物傷害",
  hit:"命中", evasion:"迴避", min_damage_multiplier:"最小傷害倍率",
  max_damage_multiplier:"最大傷害倍率", exp_gain:"經驗值獲得量",
  mesos_gain:"楓幣獲得量", final_damage:"最終傷害",
  debuff_resistance:"減益耐性", basic_attack_target_increase:"基本攻擊目標數增加",
  skill_cooldown_percent:"技能冷卻時間減少（%）",
  skill_cooldown_seconds:"技能冷卻時間減少（秒）",
  main_stat_per_4_levels:"每4等級的主屬性",
  job1_skill_level:"1轉技能等級", job2_skill_level:"2轉技能等級",
  job3_skill_level:"3轉技能等級", job4_skill_level:"4轉技能等級",
  all_skill_level:"所有技能等級"
};

const EXPECTED = {
  image_1:["attack","defense","max_hp","max_mp","crit_rate","crit_damage","attack_speed",
    "strength","dexterity","intelligence","luck","attribute_ratio_damage","mp_regen"],
  image_2:["damage_reduction","damage","damage_amplification","basic_attack_damage",
    "skill_damage","defense_penetration","boss_damage","normal_monster_damage","hit",
    "evasion","min_damage_multiplier","max_damage_multiplier","exp_gain"],
  image_3:["min_damage_multiplier","max_damage_multiplier","exp_gain","mesos_gain",
    "final_damage","debuff_resistance","basic_attack_target_increase","skill_cooldown_percent",
    "skill_cooldown_seconds","main_stat_per_4_levels","job1_skill_level","job2_skill_level",
    "job3_skill_level","job4_skill_level","all_skill_level"]
};

const SKILL_LEVEL_FIELDS = new Set(["job1_skill_level","job2_skill_level","job3_skill_level","job4_skill_level"]);

function propsFor(keys){
  const p={};
  for(const k of keys){
    const isSkill = SKILL_LEVEL_FIELDS.has(k);
    p[k]={
      type:"string",
      description:isSkill
        ? `「${FIELDS[k]}」請嚴格依圖片判斷：若面板有顯示數值就完整抄錄（包含 0）；若該欄位完全沒有出現在屬性面板，填「面板未出現該數值」；若欄位應在面板中但看不清楚或無法判讀，才填「未辨識」。不要猜。`
        : `「${FIELDS[k]}」的圖片原始文字。完整抄錄；不要換算、不要四捨五入、不要猜。看不到填「未辨識」。`
    };
  }
  return p;
}

function makeSchema(byImage=EXPECTED){
  const properties={}, required=[];
  for(let i=1;i<=3;i++){
    const key=`image_${i}`, keys=Array.isArray(byImage[key])?byImage[key]:[];
    properties[key]={
      type:"object",
      additionalProperties:false,
      properties:propsFor(keys),
      required:keys
    };
    required.push(key);
  }
  return {type:"object",additionalProperties:false,properties,required};
}

const PROMPT = `你是楓之谷角色數值截圖的精確抄錄器。
只做「圖片→數值」，不要自己做健檢。
嚴格規則：
1. 依照每張圖片指定欄位逐項抄錄。
2. 寧可「未辨識」，也不要猜。
3. 完整保留數字、逗號、小數、%、秒、萬、億。
4. 例如「696%」絕不能抄成「69%」。
5. 例如「3億1396萬」與「3189萬8075」必須完整保留。
6. 圖2與圖3重複出現的欄位，兩張都重新讀取，不要複製。
7. image_1/image_2/image_3 必須嚴格對應上傳順序。`;

const RETRY_PROMPT = `你是楓之谷角色數值截圖的精確補漏器。
這一次只重新辨識指定的少數欄位，不要處理其他欄位。
嚴格規則：
1. 逐項確認圖片上的欄位名稱，再讀取其右側對應數值。
2. 優先仔細檢查數字、小數點、%、秒、萬、億與逗號。
3. 寧可「未辨識」，也不要猜。
4. 完整抄錄圖片原始文字，不要換算、不要四捨五入。
5. 如果同一欄位在圖片中確實可見，即使字體較小，也請仔細放大並重新確認。
6. image_1/image_2/image_3 必須嚴格對應上傳順序。
7. 1轉、2轉、3轉、4轉技能等級是特殊欄位：若面板明確顯示數值（包含 0）就抄錄；若該欄位完全沒有出現在面板，填「面板未出現該數值」；只有欄位存在但無法判讀時才填「未辨識」。`;

const TARGETED_RETRY_PROMPT = `你是楓之谷角色數值的精確補漏辨識器。
這些圖片不是完整面板，而是針對單一欄位擷取並放大的局部圖片。
每張圖片只需要辨識它指定的那一個欄位。
嚴格規則：
1. 先確認圖片中的欄位名稱，再讀取該欄位右側的數值。
2. 這張圖片只回答指定欄位，不要把鄰近欄位的數值當成答案。
3. 仔細辨認數字、小數點、%、秒、萬、億與逗號。
4. 完整抄錄圖片原始文字，不要換算、不要四捨五入、不要猜。
5. 如果指定欄位清楚可見，請務必給出圖片中的原始文字；只有真的看不到或無法判讀時才填「未辨識」。
6. 1轉、2轉、3轉、4轉技能等級若確認原本屬性面板完全沒有該欄位，填「面板未出現該數值」，不要猜成 0。`;

function jsonResponse(body, status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{"Content-Type":"application/json; charset=utf-8"}
  });
}

export async function handleVision(request, env){
  try{
    if(!env.OPENAI_API_KEY){
      return jsonResponse({error:"後端尚未設定 OPENAI_API_KEY Secret。"},500);
    }

    const body=await request.json();
    const mode=body?.mode||"initial";

    // 第二階段採用「局部列裁切＋再次放大」；不要再把完整面板原封不動重送一次。
    if(mode==="targeted_retry"){
      const crops=Array.isArray(body?.retryCrops)?body.retryCrops:[];
      if(!crops.length)return jsonResponse({data:{image_1:{},image_2:{},image_3:{}},usage:null},200);
      const valid=[];
      for(const crop of crops){
        const image=crop?.image,field=crop?.field,url=crop?.image_url;
        if(!/^image_[1-3]$/.test(image)||!FIELDS[field]||typeof url!=="string"||!url.startsWith("data:image/"))continue;
        if(!EXPECTED[image].includes(field))continue;
        valid.push({image,field,url});
      }
      if(!valid.length)return jsonResponse({data:{image_1:{},image_2:{},image_3:{}},usage:null},200);

      const byImage={image_1:[],image_2:[],image_3:[]};
      for(const c of valid)if(!byImage[c.image].includes(c.field))byImage[c.image].push(c.field);
      const properties={},required=[];
      for(const c of valid){
        if(!properties[c.image])properties[c.image]={type:"object",additionalProperties:false,properties:{},required:[]};
        properties[c.image].properties[c.field]={type:"string",description:SKILL_LEVEL_FIELDS.has(c.field)
          ? `「${FIELDS[c.field]}」若局部圖中有顯示數值就抄錄（包含 0）；若確認面板完全沒有此欄位，填「面板未出現該數值」；只有看得到欄位但無法判讀時才填「未辨識」。不要猜。`
          : `「${FIELDS[c.field]}」的局部放大圖片原始文字。完整抄錄；不要換算、不要四捨五入、不要猜；看不到才填「未辨識」。`};
        if(!properties[c.image].required.includes(c.field))properties[c.image].required.push(c.field);
      }
      for(const k of ["image_1","image_2","image_3"]){
        if(properties[k])required.push(k);
      }

      const content=[{type:"input_text",text:TARGETED_RETRY_PROMPT}];
      for(const c of valid){
        content.push({type:"input_text",text:`這是 ${c.image} 的「${FIELDS[c.field]}」局部放大圖。只辨識這一個欄位：${FIELDS[c.field]}。不要回答其他欄位。`});
        content.push({type:"input_image",image_url:c.url,detail:"high"});
      }
      const apiBody={model:MODEL,input:[{role:"user",content}],text:{format:{type:"json_schema",name:"maple_character_targeted_retry_v1",strict:true,schema:{type:"object",additionalProperties:false,properties,required}}},store:false};
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),120000);
      let response;
      try{
        response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${env.OPENAI_API_KEY}`},body:JSON.stringify(apiBody),signal:controller.signal});
      }finally{clearTimeout(timer);}
      const raw=await response.json();
      if(!response.ok)return jsonResponse({error:raw?.error?.message||"OpenAI API 請求失敗。",status:response.status},response.status);
      let text=raw.output_text||"";
      if(!text&&Array.isArray(raw.output))for(const item of raw.output)if(item?.type==="message"&&Array.isArray(item.content))for(const part of item.content)if(part?.type==="output_text"&&typeof part.text==="string")text+=part.text;
      if(!text)return jsonResponse({error:"GPT 已回應，但找不到 JSON 輸出。"},502);
      let data;
      try{data=JSON.parse(text);}catch{return jsonResponse({error:"GPT 回傳內容不是有效 JSON。"},502);}
      return jsonResponse({data,usage:raw.usage||null});
    }

    const images=body?.images;
    if(!Array.isArray(images)||images.length!==3)return jsonResponse({error:"請一次提供 3 張圖片。"},400);
    if(images.some(x=>typeof x!=="string"||!x.startsWith("data:image/")))return jsonResponse({error:"圖片格式不正確。"},400);

    const isRetry=mode==="retry";
    let byImage=EXPECTED;
    if(isRetry){
      const requested=body?.retryByImage;
      byImage={image_1:[],image_2:[],image_3:[]};
      for(let i=1;i<=3;i++){
        const key=`image_${i}`;
        const list=Array.isArray(requested?.[key])?requested[key]:[];
        // 僅接受系統已知欄位，避免客戶端任意擴張 schema。
        byImage[key]=list.filter(k=>EXPECTED[key].includes(k));
      }
      if(!Object.values(byImage).some(list=>list.length)){
        return jsonResponse({data:{image_1:{},image_2:{},image_3:{}},usage:null},200);
      }
    }

    const content=[{type:"input_text",text:isRetry?RETRY_PROMPT:PROMPT}];
    for(let i=1;i<=3;i++){
      const key=`image_${i}`,keys=byImage[key];
      if(!keys.length)continue;
      content.push({
        type:"input_text",
        text:`這是第 ${i} 張圖片，對應 ${key}。只辨識以下欄位：${keys.map(k=>FIELDS[k]).join("、")}。逐項確認欄位名稱與右側數值的對應。`
      });
      content.push({type:"input_image",image_url:images[i-1],detail:"high"});
    }

    const apiBody={
      model:MODEL,
      input:[{role:"user",content}],
      text:{format:{type:"json_schema",name:isRetry?"maple_character_values_retry_v1":"maple_character_values_v5",strict:true,schema:makeSchema(byImage)}},
      store:false
    };

    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),120000);
    let response;
    try{
      response=await fetch("https://api.openai.com/v1/responses",{
        method:"POST",
        headers:{"Content-Type":"application/json", "Authorization":`Bearer ${env.OPENAI_API_KEY}`},
        body:JSON.stringify(apiBody),
        signal:controller.signal
      });
    }finally{clearTimeout(timer);}

    const raw=await response.json();
    if(!response.ok){
      return jsonResponse({error:raw?.error?.message||"OpenAI API 請求失敗。",status:response.status},response.status);
    }

    let text=raw.output_text||"";
    if(!text&&Array.isArray(raw.output)){
      for(const item of raw.output){
        if(item?.type==="message"&&Array.isArray(item.content)){
          for(const part of item.content){
            if(part?.type==="output_text"&&typeof part.text==="string")text+=part.text;
          }
        }
      }
    }
    if(!text)return jsonResponse({error:"GPT 已回應，但找不到 JSON 輸出。"},502);

    let data;
    try{data=JSON.parse(text);}catch{return jsonResponse({error:"GPT 回傳內容不是有效 JSON。"},502);}

    return jsonResponse({data,usage:raw.usage||null});
  }catch(error){
    if(error?.name==="AbortError")return jsonResponse({error:"GPT Vision 等待超過 120 秒，請稍後再試。"},504);
    console.error(error);
    return jsonResponse({error:error?.message||"後端發生未知錯誤。"},500);
  }
}

