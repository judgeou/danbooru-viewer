<script setup lang="ts">
import { ref } from 'vue'

interface IPost {
  id: number,
  file_url: string,
  large_file_url: string,
  image_height: number,
  image_width: number,
  tag_string_general: string,
  tag_string_copyright: string,
  tag_string_character: string
}

const addition_tags = [ 'rating:General' ]

const tag_input = ref('')
const posts = ref([] as IPost[])
const isLoading = ref(false)

async function search () {
  isLoading.value = true
  const tags = `${tag_input.value} ${addition_tags.join(' ')}`
  const res = await fetch(`https://danbooru.donmai.us/posts.json?limit=20&tags=${tags}`)
  posts.value = await res.json()
  isLoading.value = false
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
</script>

<template>
  <div>
    <input type="text" v-model="tag_input" style="width: 300px;">
  </div>

  <div style="margin-top: 8px;">
    <button :disabled="isLoading" @click="search" style="height: 30px;">Search</button>
  </div>

  <div class="img-container">
    <div v-for="post in posts" :key="post.id" class="img-item" @click="copy_img_tags(post)">
      <img :src="post.large_file_url">
      <!-- <div>{{ post.tag_string_general }}</div>
      <div>{{ post.tag_string_character }}</div>
      <div>{{ post.tag_string_copyright }}</div> -->
    </div>
  </div>
</template>

<style scoped>
.img-container .img-item img {
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
</style>
