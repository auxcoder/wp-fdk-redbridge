import '../../../node_modules/bootstrap/dist/js/bootstrap.bundle.js';

(function () {
  // @ts-ignore
  const {postNonce, ajaxUrl, hostUrl} = window.uxc.nameSpaced;

  const dropdownElementList = document.querySelectorAll('.dropdown-item')
  const dropdownList = [...dropdownElementList].map(elm => {
    elm.addEventListener('click', async (e) => {
      e.stopPropagation();
      const taxonomyId = elm.getAttribute('id');

      if (taxonomyId) {
        try {
          const data = {termId: taxonomyId, action: 'setCountry', postNonce: postNonce}
          const res = await postData(ajaxUrl, data);
          // @ts-ignore
          window.location = `${hostUrl}/${res.data.slug}`;
        } catch (error) {
          console.error(error);
        }
      } else {
        console.error('missing  taxonomyId for ajax');
      }
    })
  });

  async function postData(url = '', data = {}) {
    // Default options are marked with *
    const res = await fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Accept': 'application/json',
        // 'Content-Type': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: new URLSearchParams(data) // body data type must match "Content-Type" header
    });
    return res.json(); // parses JSON response into native JavaScript objects
  }
}());
