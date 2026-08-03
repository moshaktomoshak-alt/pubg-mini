(function () {
  var STORAGE_KEY = 'donyaye_bagha_offline_state_v1';

  function now() {
    return Math.floor(Date.now() / 1000);
  }

  function defaultState() {
    return {
      userId: 1,
      worldSeed: Math.floor(Math.random() * 100000),
      player: {
        x: 0,
        y: 0,
        health: 100,
        hunger: 100,
        thirst: 100,
        stamina: 100
      },
      inventory: {},
      equipped: null,
      cars: {
        main: {
          repaired: false,
          fuel: 0,
          health: 100
        }
      },
      modifications: {},
      guideSeen: false,
      waypoint: null,
      dog: {
        health: 100,
        downed: false
      },
      updatedAt: now()
    };
  }

  function writeState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Offline save failed', e);
    }
  }

  function readState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.player) return parsed;
      }
    } catch (e) {}

    var state = defaultState();
    writeState(state);
    return state;
  }

  function resetState() {
    var old = readState();
    var state = defaultState();
    state.guideSeen = !!old.guideSeen;
    writeState(state);
    return state;
  }

  function jsonResponse(payload) {
    return {
      ok: true,
      status: 200,
      json: function () {
        return Promise.resolve(payload);
      }
    };
  }

  var originalFetch = window.fetch ? window.fetch.bind(window) : null;

  window.fetch = function (input, init) {
    var url = '';

    if (typeof input === 'string') {
      url = input;
    } else if (input && input.url) {
      url = input.url;
    } else {
      url = String(input);
    }

    if (url.indexOf('/api/load') !== -1) {
      return Promise.resolve(
        jsonResponse({
          ok: true,
          state: readState(),
          firstName: 'بازیکن آفلاین'
        })
      );
    }

    if (url.indexOf('/api/save') !== -1) {
      try {
        var body = init && init.body ? JSON.parse(init.body) : {};
        if (body && body.state) {
          body.state.updatedAt = now();
          writeState(body.state);
        }
      } catch (e) {
        console.error('Offline save parse error', e);
      }

      return Promise.resolve(jsonResponse({ ok: true }));
    }

    if (url.indexOf('/api/reset') !== -1) {
      return Promise.resolve(
        jsonResponse({
          ok: true,
          state: resetState()
        })
      );
    }

    if (originalFetch) return originalFetch(input, init);

    return Promise.reject(new TypeError('Offline fetch blocked: ' + url));
  };

  var tg = window.Telegram && window.Telegram.WebApp;

  if (!tg || !tg.initData) {
    window.Telegram = {
      WebApp: {
        initData: 'offline_user',
        ready: function () {},
        expand: function () {},
        lockOrientation: function () {},
        close: function () {},
        colorScheme: 'dark',
        platform: 'android',
        version: '1.0',
        themeParams: {},
        MainButton: {
          setText: function () {},
          show: function () {},
          hide: function () {},
          onClick: function () {},
          offClick: function () {}
        },
        BackButton: {
          show: function () {},
          hide: function () {},
          onClick: function () {},
          offClick: function () {}
        },
        HapticFeedback: {
          impactOccurred: function () {},
          notificationOccurred: function () {},
          selectionChanged: function () {}
        },
        onEvent: function () {},
        offEvent: function () {}
      }
    };
  }
})();
