const csrftoken = Cookies.get('csrftoken')

document.addEventListener('DOMContentLoaded', () => {
  new_post()
  load_posts()
})

function load_posts(number = 1, username = '', following = '') {
  document.getElementById('pagination').style.display = 'none'
  document.getElementById('posts').innerHTML = ''

  if (username) {
    document.getElementById('profile').style.display = 'block'
    document.getElementById('new').style.display = 'none'
  } else if (following) {
    document.getElementById('profile').style.display = 'none'
    document.getElementById('new').style.display = 'none'
  } else {
    document.getElementById('profile').style.display = 'none'
    document.getElementById('new').style.display = 'block'
  }

  fetch(`/posts?profile=${username}&following=${following}&page=${number}`).then(response => response.json()).then(data => {

    console.log(data)
    data[0].forEach(post => {
      const Post = document.createElement("div")
      const head = document.createElement("div")
      const body = document.createElement("div")
      const like = document.createElement("button")
      const text = document.createElement("p")
      const user = document.createElement("p")

      Post.className = 'card'
      head.className = 'card-header'
      body.className = 'card-body'
      like.className = post.like ? 'btn btn-primary' : 'btn btn-outline-primary'
      like.innerHTML = `<i class="fa fa-thumbs-up" aria-hidden="true">${post.count}</i>`
      head.innerHTML = `<div class="text-muted">${post.timestamp}</div>`
      user.innerHTML = `@${post.user}`
      text.innerHTML = post.content
      body.dataset.id = post.id
      like.dataset.like = post.like
      head.prepend(user)
      body.append(text, like)

      if (!username) {
        user.className = 'username'
        user.onclick = () => profile(user.textContent.slice(1))
      }

      if (data[1].loged) {
        like.onclick = () => like_(like)
        if (post.author) {
          const div = document.createElement("div")
          const edit = document.createElement("button")
          const cancel = document.createElement("button")
          div.className = 'edit-buttons'
          edit.className = 'btn btn-outline-primary'
          cancel.className = 'btn btn-outline-danger d-none'
          edit.textContent = 'Edit'
          cancel.textContent = 'Cancel'
          edit.onclick = () => edit_(edit)
          div.append(cancel, edit)
          body.append(div)
        }
      }

      Post.append(head, body)
      document.getElementById('posts').append(Post)
    })

    paginate(data[1], username, following)
    document.getElementById('pagination').style.display = 'flex'
  })
}

function paginate(page, username, following) {
  const previous = document.getElementById('previous')
  const next = document.getElementById('next')
  if (page.previous) {
    previous.classList.remove('disabled')
    previous.firstElementChild.onclick = () => load_posts(page.number - 1, username, following)
  } else {
    previous.classList.add('disabled')
  }
  if (page.next) {
    next.classList.remove('disabled')
    next.firstElementChild.onclick = () => load_posts(page.number + 1, username, following)
  } else {
    next.classList.add('disabled')
  }
  document.getElementById('number').firstElementChild.textContent = page.number
}

function new_post() {
  if (document.getElementById('body')) {
    body = document.getElementById('body')

    document.querySelector('form').onsubmit = () => {
      const request = new Request(
        '/new',
        {
          method: 'POST',
          mode: 'same-origin',
          body: JSON.stringify({ body: body.value }),
          headers: { 'X-CSRFToken': csrftoken },
        }
      )
      fetch(request).then(response => response.json()).then(result => {
        console.log(result)
        if (result.message) {
          body.value = ''
          load_posts()
        }
      })
      return false
    }
  }
}

function like_(button) {
  const id = button.parentNode.dataset.id
  const like = JSON.parse(button.dataset.like)

  const request = new Request(
    '/like',
    {
      method: 'PUT',
      mode: 'same-origin',
      body: JSON.stringify({ id: id, like: like }),
      headers: { 'X-CSRFToken': csrftoken },
    }
  )
  fetch(request).then(response => response.json()).then(result => {
    console.log(result)
    if (result.message) {
      button.dataset.like = !like
      button.innerHTML = `<i class="fa fa-thumbs-up" aria-hidden="true"> ${result.count}</i>`
      if (like) {
        button.classList.remove('btn-primary')
        button.classList.add('btn-outline-primary')
      } else {
        button.classList.remove('btn-outline-primary')
        button.classList.add('btn-primary')
      }
    }
  })
}

function edit_(button) {
  const textarea = document.createElement("textarea")
  const cancel = button.parentNode.firstElementChild
  const body = button.parentNode.parentNode
  const post = body.firstElementChild
  const id = body.dataset.id

  textarea.classList.add('form-control', 'mb-3')
  textarea.value = post.textContent
  body.replaceChild(textarea, post)

  cancel.classList.remove('d-none')
  cancel.onclick = () => {
    body.replaceChild(post, textarea)
    editbutton(button)
    cancel.classList.add('d-none')
  }

  button.classList.remove('btn-outline-primary')
  button.classList.add('btn-outline-success')
  button.textContent = "Save"
  button.onclick = () => {
    const request = new Request(
      `/edit`,
      {
        method: 'POST',
        mode: 'same-origin',
        body: JSON.stringify({ id: id, body: textarea.value }),
        headers: { 'X-CSRFToken': csrftoken },
      }
    )
    fetch(request).then(response => response.json()).then(result => {
      console.log(result)
      post.textContent = textarea.value
      body.replaceChild(post, textarea)
      editbutton(button)
      cancel.classList.add('d-none')
    })
  }
}

function editbutton(button) {
  button.classList.remove('btn-outline-success')
  button.classList.add('btn-outline-primary')
  button.textContent = "Edit"
  button.onclick = () => edit_(button)
}

function follow_(username) {
  const request = new Request(
    '/follow',
    {
      method: 'PUT',
      mode: 'same-origin',
      body: JSON.stringify({ username: username }),
      headers: { 'X-CSRFToken': csrftoken },
    }
  )
  fetch(request).then(response => response.json()).then(result => {
    console.log(result)
    profile(username)
  })
}

function profile(username) {
  document.getElementById('profile').innerHTML = ''

  fetch(`/profile?username=${username}`).then(response => response.json()).then(result => {

    const card = document.createElement('div')
    const body = document.createElement('div')
    const data = document.createElement('div')
    const user = document.createElement('h4')

    card.className = 'card'
    body.className = 'card-body profile'
    data.className = 'follow-data'
    user.textContent = `@${username}`
    data.textContent = `Followers ${result.followers} || Following ${result.following}`
    body.append(user, data)

    if (result.valid) {
      const follow = document.createElement('button')
      follow.style.marginLeft = '13px'
      if (result.follow) {
        follow.textContent = 'Unfollow'
        follow.className = 'btn btn-outline-dark btn-sm'
      } else {
        follow.textContent = 'Follow'
        follow.className = 'btn btn-dark btn-sm'
      }
      follow.onclick = () => follow_(username)
      body.insertBefore(follow, data)
    }

    card.append(body)
    document.getElementById('profile').append(card)
  })
  load_posts(1, username)
}