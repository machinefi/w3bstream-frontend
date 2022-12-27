export const definitions = {
  projects: {
    type: 'string',
    get enum() {
      return globalThis.store.w3s.allProjects.value?.map((i) => `${i.f_project_id}`) || [];
    },
    get enumNames() {
      return globalThis.store.w3s.allProjects.value?.map((i) => `${i.f_name}`) || [];
    }
  },
  projectName: {
    type: 'string',
    get enum() {
      return globalThis.store.w3s.allProjects.value?.map((i) => `${i.f_name}`) || [];
    },
    get enumNames() {
      return globalThis.store.w3s.allProjects.value?.map((i) => `${i.f_name}`) || [];
    }
  },
  publishers: {
    type: 'string',
    get enum() {
      const allPublishers = globalThis.store.w3s.publisher.table.dataSource;
      return allPublishers.map((i) => `${i.f_publisher_id}`);
    },
    get enumNames() {
      const allPublishers = globalThis.store.w3s.publisher.table.dataSource;
      return allPublishers.map((i) => `${i.f_name}`);
    }
  },
  applets: {
    type: 'string',
    get enum() {
      const allApplets = globalThis.store.w3s.applet.allData;
      return allApplets.map((i) => i.f_applet_id);
    },
    get enumNames() {
      const allApplets = globalThis.store.w3s.applet.allData;
      return allApplets.map((i) => `${i.f_name}`);
    }
  }
};
