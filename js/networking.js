const api_get = async (category, type, name) => {
  // tiles: (theme/page/search)
  // users: (data/login/new)
  const req = url + category +'/'+ type +'/'+ name;
  const params = {
    headers: {'content-type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'GET',
  };
  const res = await fetch(req, params).then((response) => {
    return response.json();
  }).then((json) => {
    return json;
  }).catch((error) => {
    return {error: error};
  });
  return res;
};

const api_set = async (category, type, data) => {
  // tiles: (new/edit/delete)
  // users: (new/update)
  const req = url + category +'/'+ type;
  const params = {
    headers: {'content-type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + localStorage.getItem('token')},
    method: 'POST',
    body: JSON.stringify(data),
  };
  const res = await fetch(req, params).then((response) => {
    return response.json();
  }).then((json) => {
    return json;
  }).catch((error) => {
    return {'error': error};
  });
  return res;
};

const login = async (username, password) => {
  const raw = await api_set('users', 'login',
    {'user': username, 'pass': password});
  if (raw.token) {
    console.log(username + ' logged in');
    localStorage.token = raw.token;
    pages = {};
    user_init();
  } else {
    alert('Invalid login');
    console.log('Invalid login attempt');
  }
};

const register = async (username, password) => {
  const new_user = {
    username: username,
    password: password,
    dimensions: [4, 3],
    theme: default_tiles.theme,
    api: 'https://img.icons8.com/color/96/000000/',
  };
  new_user.theme.theme.user = username;
  const res = await api_set('users', 'new', new_user);
  if (res.error) {
    alert('Username taken');
  } else {
    await login(username, password);
    pages['home'] = [];
    new_tile('page', 'search', 'Search', 'engines', '~search', 'home');
    new_tile('page', 'themes', 'Themes', 'Color Scheme',
      '~technology-items', 'home');
  }
};

const user_init = async () => {
  const user_res = await api_get('users', 'data', '');
  if (user_res.error || !user_res) {
    console.log('Server Error: ', user_res.error);
    generate_table(4, 3); // make user profile set width and height
    set_tile(default_tiles.login_tile, 1);
    set_tile(default_tiles.register_tile, 2);
    set_tile(default_tiles.reload_tile, 3);
  } else {
    user = user_res;
    generate_table(user.dimensions[0], user.dimensions[1]); // width and height
    if (user.theme.theme && user.theme !== 'default' &&
      localStorage.theme !== null &&
      JSON.stringify(user.theme) !==
      JSON.stringify(localStorage.theme.split(','))) {
      set_theme(user.theme.theme);
      localStorage.theme = user.theme.theme;
    }
    await get_pages();
    set_font(user.font);
    page_gen('home');
  }
};

const user_update = async () => {
  if (JSON.stringify(user.theme) !==
    JSON.stringify(localStorage.theme.split(','))) {
    localStorage.theme = user.theme.theme;
  }
  await api_set('users', 'update', user);
};

const tiles_update = async (tiles) => { // push updates to server
  for (const i in tiles) {
    api_set('tiles', 'edit', tiles[i]);
    if (tiles[i].position > (width * height)) {
      tiles[i].position = tiles[i].position - (width * height);
    }
    set_tile(tiles[i]);
  }
};

const get_pages = async () => {
  const page = await api_get('tiles', 'page', 'all');
  page.reduce((_, it) => {
    pages[it.page] ? pages[it.page].unshift(it) : pages[it.page] = [it];
  }, {});
  for (const i in pages) pages[i].sort((a, b) => a.position - b.position);
  if (!Object.keys(pages).length) pages['home'] = [];
  update_forms(); // update whenever pages are updated
};