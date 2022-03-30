import './ComposerView.css';

import {
    ComposerViewModel,
} from 'hydrogen-view-sdk';

interface IComposerView {
  vm: typeof ComposerViewModel;
}

export function ComposerView({
    vm,
}: IComposerView) {
    const handleSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
        const target = ev.target as typeof ev.target & {
      message: { value: string };
    };
        const message = target.message.value.trim();
        if (message === '') return;
        target.message.value = '';
        vm.sendMessage(message);
    };

    return (
        <div className="ComposerView flex items-center">
            <form className="grow" onSubmit={handleSubmit}>
                <input name="message" type="text" placeholder="Send message" />
            </form>
        </div>
    );
}
