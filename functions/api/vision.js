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

function propsFor(keys){
  const p={};
  for(const k of keys){
    p[k]={
      type:"string",
      description:`「${FIELDS[k]}」的圖片原始文字。完整抄錄；不要換算、不要四捨五入、不要猜。看不到填「未辨識」。`
    };
  }
  return p;
}

function makeSchema(){
  const properties={}, required=[];
  for(let i=1;i<=3;i++){
    const key=`image_${i}`, keys=EXPECTED[key];
    properties[key]={
      type:"object",
      additionalProperties:false,
      properties:propsFor(keys),
      required:keys
    };
    required.push(key);
  }
  return {
    type:"object",
    additionalProperties:false,
    properties,
    required
  };
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

function jsonResponse(body, status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{"Content-Type":"application/json; charset=utf-8"}
  });
}

export async function onRequestPost(context){
  try{
    const {request,env}=context;
    if(!env.OPENAI_API_KEY){
      return jsonResponse({error:"後端尚未設定 OPENAI_API_KEY Secret。"},500);
    }

    const body=await request.json();
    const images=body?.images;
    if(!Array.isArray(images)||images.length!==3){
      return jsonResponse({error:"請一次提供 3 張圖片。"},400);
    }
    if(images.some(x=>typeof x!=="string"||!x.startsWith("data:image/"))){
      return jsonResponse({error:"圖片格式不正確。"},400);
    }

    const content=[{type:"input_text",text:PROMPT}];
    images.forEach((url,i)=>{
      const key=`image_${i+1}`;
      content.push({
        type:"input_text",
        text:`這是第 ${i+1} 張圖片，對應 ${key}。只辨識：${EXPECTED[key].map(k=>FIELDS[k]).join("、")}`
      });
      content.push({type:"input_image",image_url:url,detail:"high"});
    });

    const apiBody={
      model:MODEL,
      input:[{role:"user",content}],
      text:{
        format:{
          type:"json_schema",
          name:"maple_character_values_v4",
          strict:true,
          schema:makeSchema()
        }
      },
      store:false
    };

    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),120000);
    let response;
    try{
      response=await fetch("https://api.openai.com/v1/responses",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${env.OPENAI_API_KEY}`
        },
        body:JSON.stringify(apiBody),
        signal:controller.signal
      });
    }finally{
      clearTimeout(timer);
    }

    const raw=await response.json();
    if(!response.ok){
      return jsonResponse({
        error:raw?.error?.message||"OpenAI API 請求失敗。",
        status:response.status
      },response.status);
    }

    let text=raw.output_text||"";
    if(!text&&Array.isArray(raw.output)){
      for(const item of raw.output){
        if(item?.type==="message"&&Array.isArray(item.content)){
          for(const part of item.content){
            if(part?.type==="output_text"&&typeof part.text==="string") text+=part.text;
          }
        }
      }
    }
    if(!text){
      return jsonResponse({error:"GPT 已回應，但找不到 JSON 輸出。"},502);
    }

    let data;
    try{
      data=JSON.parse(text);
    }catch{
      return jsonResponse({error:"GPT 回傳內容不是有效 JSON。"},502);
    }

    // Only return the parsed recognition data to the browser.
    // The OpenAI raw response stays on the backend.
    return jsonResponse({
      data,
      usage:raw.usage||null
    });
  }catch(error){
    if(error?.name==="AbortError"){
      return jsonResponse({error:"GPT Vision 等待超過 120 秒，請稍後再試。"},504);
    }
    console.error(error);
    return jsonResponse({error:error?.message||"後端發生未知錯誤。"},500);
  }
}
