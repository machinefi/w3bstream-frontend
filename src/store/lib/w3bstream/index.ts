import NextRouter from 'next/router';
import { SpotlightAction } from '@mantine/spotlight';
import { configure, makeAutoObservable, toJS } from 'mobx';
import RootStore from '@/store/root';
import { axios } from '@/lib/axios';
import { eventBus } from '@/lib/event';
import { _ } from '@/lib/lodash';
import { trpc } from '@/lib/trpc';
import { hooks } from '@/lib/hooks';
import { PromiseState } from '@/store/standard/PromiseState';
import { AppletType, ChainHeightType, ChainTxType, ContractLogType, ProjectType } from '@/server/routers/w3bstream';
import { ProjectManager } from './project';
import { FilesListSchema } from './schema/filesList';
import W3bstreamConfigModule from './schema/config';
import LoginModule from './schema/login';
import PasswordModule from './schema/password';
import ProjectModule from './schema/project';
import PublishEventModule from './schema/publishEvent';
import PublisherModule from './schema/publisher';
import StrategyModule from './schema/strategy';
import AppletModule from './schema/applet';
import InstancesModule from './schema/instances';
import PostmanModule from './schema/postman';
import ContractLogModule from './schema/contractLog';
import ChainTxModule from './schema/chainTx';
import ChainHeightModule from './schema/chainHeight';

configure({
  enforceActions: 'never'
});

export class W3bStream {
  rootStore: RootStore;
  config = new W3bstreamConfigModule();
  login = new LoginModule();
  projectManager = new ProjectManager();
  project = new ProjectModule();
  applet = new AppletModule();
  instances = new InstancesModule();
  password = new PasswordModule();
  publisher = new PublisherModule();
  postman = new PostmanModule();
  strategy = new StrategyModule();
  publishEvent = new PublishEventModule();
  contractLogs = new ContractLogModule();
  chainTx = new ChainTxModule();
  chainHeight = new ChainHeightModule();

  allProjects = new PromiseState<() => Promise<any>, ProjectType[]>({
    defaultValue: [],
    function: async () => {
      const res = await trpc.api.projects.query({ accountID: this.config.form.formData.accountID });
      if (res) {
        const applets = [];
        const instances = [];
        let strategies = [];
        let publishers = [];
        res.forEach((p: ProjectType) => {
          // p.project_files = new FilesListSchema();
          p.applets.forEach((a: AppletType) => {
            a.project_name = p.f_name;
            a.instances.forEach((i) => {
              instances.push({
                project_id: p.f_project_id,
                project_name: p.f_name,
                applet_id: a.f_applet_id,
                applet_name: a.f_name,
                ...i
              });
            });
            applets.push({
              ...a,
              project_name: p.f_name
            });
            strategies = strategies.concat(a.strategies);
          });
          p.publishers.forEach((pub) => {
            publishers.push({
              ...pub,
              project_id: p.f_project_id,
              project_name: p.f_name
            });
          });
        });

        console.log(toJS(res));

        this.applet.set({
          allData: applets
        });

        // this.applet.form.getDymaicData = () => {
        //   return {
        //     ready: this.allProjects.value.length > 0
        //   };
        // };

        this.instances.table.set({
          dataSource: instances
        });
        this.strategy.table.set({
          dataSource: strategies
        });
        this.publisher.table.set({
          dataSource: publishers
        });
      }

      return res;
    }
  });

  curProjectIndex = 0;
  get curProject() {
    return this.allProjects.value ? this.allProjects.value[this.curProjectIndex] : null;
  }

  // get curFilesList() {
  //   return this.curProject ? this.curProject.project_files.extraData.files : [];
  // }
  // get curFilesListSchema() {
  //   return this.curProject ? this.curProject.project_files : null;
  // }
  deployApplet = new PromiseState({
    function: async ({ appletID }: { appletID: string }) => {
      const res = await axios.request({
        method: 'post',
        url: `/srv-applet-mgr/v0/deploy/applet/${appletID}`
      });
      eventBus.emit('instance.deploy');
      return res.data;
    }
  });

  handleInstance = new PromiseState({
    function: async ({ instaceID, event }: { instaceID: string; event: string }) => {
      const res = await axios.request({
        method: 'put',
        url: `/srv-applet-mgr/v0/deploy/${instaceID}/${event}`
      });
      eventBus.emit('instance.handle');
      return res.data;
    }
  });

  allContractLogs = new PromiseState<() => Promise<any>, ContractLogType[]>({
    defaultValue: [],
    function: async () => {
      const res = await trpc.api.contractLogs.query();
      if (res) {
        this.contractLogs.table.set({
          dataSource: res
        });
      }
      return res;
    }
  });
  allChainTx = new PromiseState<() => Promise<any>, ChainTxType[]>({
    defaultValue: [],
    function: async () => {
      const res = await trpc.api.chainTx.query();
      if (res) {
        this.chainTx.table.set({
          dataSource: res
        });
      }
      return res;
    }
  });
  allChainHeight = new PromiseState<() => Promise<any>, ChainHeightType[]>({
    defaultValue: [],
    function: async () => {
      const res = await trpc.api.chainHeight.query();
      if (res) {
        this.chainHeight.table.set({
          dataSource: res
        });
      }
      return res;
    }
  });

  showContent: 'CURRENT_APPLETS' | 'ALL_APPLETS' | 'ALL_INSTANCES' | 'ALL_STRATEGIES' | 'ALL_PUBLISHERS' | 'EDITOR' | 'DOCKER_LOGS' | 'ALL_CONTRACT_LOGS' | 'All_CHAIN_TX' | 'All_CHAIN_HEIGHT' =
    'CURRENT_APPLETS';

  isReady = false;

  get isLogin() {
    return !!this.config.form.formData.token;
  }

  get actions(): SpotlightAction[] {
    return [this.project, this.applet, this.publisher].map((i) => ({ title: i.modal.value.title, onTrigger: () => i.modal.set({ show: true }) }));
  }

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
    this.initEvent();
    setTimeout(() => {
      this.initHook();
    }, 100);
  }
  initEvent() {
    eventBus
      .on('app.ready', async () => {
        this.isReady = true;
        if (this.isLogin) {
          await axios.request({
            method: 'get',
            url: '/srv-applet-mgr/v0/project'
          });
        }
      })
      .on('user.login', async () => {
        NextRouter.push('/');
      })
      .on('user.update-pwd', () => {})
      .on('project.create', async () => {
        await this.allProjects.call();
        this.projectManager.sync();
      })
      .on('project.delete', async () => {
        await this.allProjects.call();
      })
      .on('applet.create', async () => {
        await this.allProjects.call();
        this.projectManager.sync();
      })
      .on('applet.publish-event', () => {})
      .on('instance.deploy', async () => {
        await this.allProjects.call();
        this.projectManager.sync();
      })
      .on('instance.handle', async () => {
        await this.allProjects.call();
        this.projectManager.sync();
      })
      .on('publisher.create', async () => {
        await this.allProjects.call();
        this.projectManager.sync();
      })
      .on('postman.request', async () => {
        await this.allProjects.call();
      })
      .on('publisher.update', async () => {
        await this.allProjects.call();
      })
      .on('publisher.delete', async () => {
        await this.allProjects.call();
      })
      .on('strategy.create', async () => {
        await this.allProjects.call();
      })
      .on('strategy.update', async () => {
        await this.allProjects.call();
      })
      .on('strategy.delete', async () => {
        await this.allProjects.call();
      })
      .on('contractlog.create', async () => {
        this.allContractLogs.call();
      })
      .on('contractlog.delete', async () => {
        this.allContractLogs.call();
      })
      .on('chainTx.create', async () => {
        this.allChainTx.call();
      })
      .on('chainTx.delete', async () => {
        this.allChainTx.call();
      })
      .on('chainHeight.create', async () => {
        this.allChainHeight.call();
      })
      .on('chainHeight.delete', async () => {
        this.allChainHeight.call();
      });
  }

  initHook() {
    hooks.waitLogin().then(async () => {
      await this.allProjects.call();
      this.projectManager.sync();
      this.allContractLogs.call();
      this.allChainTx.call();
      this.allChainHeight.call();
    });
  }
}
