<script setup lang="ts">
import { nextTick, ref, computed } from 'vue'

interface IPost {
  id: number,
  file_url: string,
  large_file_url: string,
  image_height: number,
  image_width: number,
  tag_string_general: string,
  tag_string_copyright: string,
  tag_string_character: string,
  tag_string_artist: string,
  file_ext: string
}

interface ITagsCompleteItem {
  antecedent?: string,
  category: string,
  label: string,
  post_count: number,
  type: string,
  value: string
}

const service_list = [
  {
    name: 'danbooru',
    host: 'danbooru.donmai.us',
    post_path: 'posts.json',
    open_path: 'posts',
    sample_url_field: 'large_file_url'
  }, {
    name: 'yande',
    host: 'yande.re',
    post_path: 'post.json',
    open_path: 'post/show',
    sample_url_field: 'sample_url'
  }
]

const addition_tags = [] as string[]

const service_selected = ref(1)
const tag_input = ref('')
const posts = ref([] as IPost[])
const isLoading = ref(false)

const rating = ref(['None'])
const score = ref(90)
const ageMonth = ref(12)
const img_opacity = ref(10)
const page = ref(1)
const tags_complete_items = ref([] as ITagsCompleteItem[])
const el_taginput = ref<HTMLInputElement>()
const img_src_queue = ref([] as IPost[])
const img_src_loaded = ref([] as IPost[])

const use_random = ref(true)
const maxid = ref(Number(localStorage.getItem("DANBOORU_VIEWER_MAXID") || 6000))

const service = computed(() => service_list[service_selected.value])

function id_range_tag () {
  return ''
}

function getRandomInt (min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function get_tagstr () {
  if (rating.value.length > 0 && rating.value[0] === 'None') {
    return ''
  } else {
    return 'rating:' + rating.value.join(',')
  }
}

async function search (is_newest = false) {
  try {
    isLoading.value = true

    const rating_tagstr = get_tagstr()
    const tags = `${tag_input.value} ${rating_tagstr} ${addition_tags.join(' ')} ${is_newest ? '' : id_range_tag()}`
    const pageIndex = is_newest ? page.value : getRandomInt(1, maxid.value)
    const res = await fetch(`https://${service.value.host}/${service.value.post_path}?limit=20&page=${pageIndex}&tags=${tags}`)
    posts.value = await res.json()
    
    img_src_queue.value = [...posts.value].filter(item => (item as any)[service.value.sample_url_field])
    img_src_loaded.value = []
    if (img_src_queue.value.length > 0) {
      img_src_loaded.value.push(img_src_queue.value.pop()!)
    }
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

function load_next_img () {
  if (img_src_queue.value.length > 0) {
    img_src_loaded.value.push(img_src_queue.value.pop()!)
  }
  if (img_src_queue.value.length > 0) {
    img_src_loaded.value.push(img_src_queue.value.pop()!)
  }
}

async function copy_img_tags (post: IPost) {
  const alltags = [
    ...post.tag_string_character.split(' '),
    ...post.tag_string_general.split(' ')
  ]
  const tags_copy = alltags.join(', ')

  await navigator.clipboard.writeText(tags_copy)

  alert(tags_copy.slice(0, 100) + '...')
}

async function trigger_complete () {
  if (tag_input.value.length >= 2) {
    const input = tag_input.value.split(' ').pop() || ''
    const res = await fetch(`https://danbooru.donmai.us/autocomplete.json?search%5Bquery%5D=${encodeURIComponent(input)}&search%5Btype%5D=tag_query&version=1&limit=20`)
    const items = await res.json() as ITagsCompleteItem[]

    tags_complete_items.value = items
  } else {
    tags_complete_items.value = []
  }
}

async function input_complete (item: ITagsCompleteItem) {
  const tag_input_list = tag_input.value.split(' ')
  tag_input_list[tag_input_list.length - 1] = item.value
  tag_input.value = tag_input_list.join(' ') + ' '
  tags_complete_items.value = []

  await nextTick()
  el_taginput.value?.focus()
}

function open_site () {
  window.open(`https://${service.value.host}/${service.value.open_path}?tags=${tag_input.value}`)
}

function save_maxid () {
  localStorage.setItem("DANBOORU_VIEWER_MAXID", maxid.value.toString())
}
</script>

<template>
  <div>
    <select v-model="service_selected">
      <option v-for="(item, index) in service_list" :value="index">{{ item.name }}</option>
    </select>
    <input ref="el_taginput" type="text" placeholder="tags" v-model="tag_input" style="width: 300px;"
      @keydown.enter="open_site" @input="trigger_complete">
    <button @click="tag_input += ' order:random'">
      random
    </button>
    <select v-model="rating" multiple>
      <option v-for="item in ['None', 'Safe', 'General', 'Sensitive', 'Questionable', 'Explicit', 'q', 'e']" :value="item">{{ item }}</option>      
    </select>

    age*:<input @keydown.enter="tag_input += ` age:<${ageMonth}month`" type="number" min="1" max="24" v-model="ageMonth" />
    score*:<input @keydown.enter="tag_input += ` score:>${score}`" type="number" v-model="score" min="0" max="1000" placeholder="score">
    page:<input type="number" v-model="page" min="0" max="100" placeholder="page">
    opacity:<input type="number" v-model="img_opacity" min="0" max="10" />

    <input type="text" v-model="maxid" @keydown.enter="save_maxid" />
    <input type="checkbox" v-model="use_random">

  </div>

  <div v-if="tags_complete_items.length > 0" class="tags-complete">
    <div v-for="item in tags_complete_items" class="tags-complete-item" @click="input_complete(item)">
      <span v-if="item.antecedent">{{ item.antecedent }} -> </span>{{ item.label }}
    </div>
  </div>

  <div style="margin-top: 8px;">
    <button :disabled="isLoading" @click="search(false)" style="height: 30px;">Search</button>
    <button :disabled="isLoading" @click="search(true)" style="height: 30px;">Newest</button>
  </div>

  <div class="img-container">
    <div v-for="post in img_src_loaded" :key="post.id" class="img-item" @click="copy_img_tags(post)">
      <img v-if="['png', 'jpg', 'gif'].indexOf(post.file_ext) >= 0"
           :src="(post as any)[service.sample_url_field]"
           :style="{ opacity: img_opacity / 10 }"
           @load="load_next_img"
           @error="load_next_img">
      <video v-if="['mp4', 'webm'].indexOf(post.file_ext) >= 0" 
           :src="post.large_file_url"
           :style="{ opacity: img_opacity / 10 }"
           @load="load_next_img"
           @error="load_next_img"></video>

      <div class="links">
        <a target="_blank" :href="`https://${service.host}/${service.open_path}/${post.id}`">open</a>
        <a target="_blank" :href="`https://${service.host}/posts?tags=${encodeURIComponent(post.tag_string_artist)}`">artist</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.img-container .img-item img, .img-container .img-item video {
  width: 250px;
  height: auto;
  display: block;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}
.img-container .img-item {
  flex: 1 0 calc(100% / 3);
  max-width: calc(100% / 3);
  margin-bottom: 80px;
}
.img-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 12px;
}
.links a {
  margin-right: 8px;
}
.tags-complete {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
}
.tags-complete .tags-complete-item {
  margin-right: 8px;
  border: 1px solid #c7b2b2;
  padding: 2px;
  margin-bottom: 8px;
  cursor: pointer;
}
</style>
