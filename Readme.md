# Readme

- [Fabric Dev Kit](https://github.com/yeswework/fabrica-dev-kit)
- [Timber](https://upstatement.com/timber/)
  - [Timber & WooCommerce](https://timber.github.io/docs/guides/woocommerce/)
- [create-guten-block](https://github.com/ahmadawais/create-guten-block)

---

### Running the master Webpack during active development

* To start developing, run `fdk start` in the project folder. FDK will tell you which dynamic port the site front-end, admin and database are accessible at for this session, for example:

### Local database access

For direct MySQL access to the development database, you can use an app such as [Sequel Pro](https://www.sequelpro.com/) while the development machine is up. The database server is accessible at `127.0.0.1`, and with the dynamic port which you'll be told when you run `fdk start` (see example output above). The username, password and database name are are `wordpress`.


## Deploy

A new Movefile is generated from a Gulp task (wordmove). Databases with

- [Different tables prefixes are *not* supported](https://github.com/welaika/wordmove/wiki/Disclaimer:-different-tables-prefixes-are-*not*-supported)
- [movefile.yml configurations explained](https://github.com/welaika/wordmove/wiki/movefile.yml-configurations-explained)

---

### Troubleshooting and housekeeping
If you run into any problems during development, restarting the Docker machine may help. Stop FDK with ctrl + c and then run `fdk dc restart` followed by `fdk start` again.

Multiple projects' Docker servers running simultaneously can hog system resources, so you can safely suspend any projects not currently being developed with `fd dc stop` in the project folder (or from the Docker Dashboard). Equally it is safe to run `fdk remove` which removes the project's containers altogether (the local database is preserved); to set them up again you can run `fdk setup --reinstall`.

---

## Issues

- `Head https://registry-1.docker.io/v2/library/mysql/manifests/5.7: unauthorized: incorrect username or password`
  - run `docker logout` to logout from Docker Hub
  - [issue](https://github.com/docker/hub-feedback/issues/1098#issuecomment-316309768)
