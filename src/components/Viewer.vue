<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'

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

const addition_tags = [] as string[]

const tag_input = ref('')
const posts = ref([] as IPost[])
const isLoading = ref(false)
const isRandom = ref(true)
const random_startdate = ref('2015-01-01')
const random_enddate = ref(dayjs().format('YYYY-MM-DD'))
const rating = ref('Safe')
const img_opacity = ref(10)
const page = ref(1)
const tags_complete_items = ref([] as ITagsCompleteItem[])

async function search () {
  isLoading.value = true
  const tags = `${tag_input.value} rating:${rating.value} ${addition_tags.join(' ')} ${get_random_tags()}`
  const res = await fetch(`https://danbooru.donmai.us/posts.json?limit=20&page=${page.value}&tags=${tags}`)
  posts.value = await res.json()
  isLoading.value = false
}

function get_random_tags () {
  if (isRandom.value) {
    // 定义开始和结束日期
    const startDate = dayjs(random_startdate.value)
    const endDate = dayjs(random_enddate.value)

    const months = endDate.diff(startDate, 'month');
    const randomMonths = Math.floor(Math.random() * months);
    const resultDate = startDate.add(randomMonths, 'month');
    const resultDateStart = resultDate.startOf('month')
    const resultDateEnd = resultDate.endOf('month')

    return `date:>=${resultDateStart.format('YYYY-MM-DD')} date:<=${resultDateEnd.format('YYYY-MM-DD')} order:random`
  } else {
    return ''
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

function input_complete (item: ITagsCompleteItem) {
  const tag_input_list = tag_input.value.split(' ')
  tag_input_list[tag_input_list.length - 1] = item.value
  tag_input.value = tag_input_list.join(' ')
  tags_complete_items.value = []
}
</script>

<template>
  <div>
    <input type="text" placeholder="tags" v-model="tag_input" style="width: 300px;" @input="trigger_complete">
    <label>
      <input type="checkbox" v-model="isRandom"> random
    </label>
    <select v-model="rating">
      <option v-for="item in ['Safe', 'General', 'Sensitive', 'Questionable', 'Explicit']" :value="item">{{ item }}</option>      
    </select>

    <span v-if="isRandom">
      <input type="date" v-model="random_startdate" />
      <input type="date" v-model="random_enddate" />
    </span>

    <input type="number" v-model="img_opacity" min="0" max="10" />
    <input type="number" v-model="page" min="0" max="100" placeholder="page">

  </div>

  <div v-if="tags_complete_items.length > 0" class="tags-complete">
    <div v-for="item in tags_complete_items" class="tags-complete-item" @click="input_complete(item)">
      <span v-if="item.antecedent">{{ item.antecedent }} -> </span>{{ item.label }}
    </div>
  </div>

  <div style="margin-top: 8px;">
    <button :disabled="isLoading" @click="search" style="height: 30px;">Search</button>
  </div>

  <div class="img-container">
    <div v-for="post in posts" :key="post.id" class="img-item" @click="copy_img_tags(post)">
      <img v-if="['png', 'jpg', 'gif'].indexOf(post.file_ext) >= 0" 
           :src="post.large_file_url"
           :style="{ opacity: img_opacity / 10 }">
      <video v-if="['mp4', 'webm'].indexOf(post.file_ext) >= 0" 
           :src="post.large_file_url"
           :style="{ opacity: img_opacity / 10 }"></video>

      <div class="links">
        <a target="_blank" :href="`https://danbooru.donmai.us/posts/${post.id}`">open</a>
        <a target="_blank" :href="`https://danbooru.donmai.us/posts?tags=${encodeURIComponent(post.tag_string_artist)}`">artist</a>
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
